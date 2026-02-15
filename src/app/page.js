"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import { fetchOutfits, uploadImage, saveOutfit } from "@/lib/outfitService";

export default function Home() {
  const [outfits, setOutfits] = useState([]);
  const [filter, setFilter] = useState("全部");
  const [seasonFilter, setSeasonFilter] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureImage, setCaptureImage] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sharingItem, setSharingItem] = useState(null);
  const [xianyuCopy, setXianyuCopy] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [location, setLocation] = useState("本地");
  const [editingItem, setEditingItem] = useState(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      let cloudData = [];
      let localData = [];

      // 1. 获取云端数据
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
        try {
          cloudData = await fetchOutfits();
        } catch (e) {
          console.warn("云端同步失败", e);
        }
      }

      // 2. 获取本地数据
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("outfits");
        if (saved) {
          try {
            localData = JSON.parse(saved);
          } catch (e) {
            console.error("解析本地存档失败", e);
          }
        }
      }

      // 3. 合并并去重 (使用 id 作为唯一标识)
      const combined = [...cloudData];
      const cloudIds = new Set(cloudData.map(o => o.id));

      localData.forEach(item => {
        if (!cloudIds.has(item.id)) {
          combined.push(item);
        }
      });

      // 4. 按创建时间排序
      setOutfits(combined.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp)));
      setMounted(true);
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      clearInterval(interval);
      setMounted(false);
    };
  }, []);

  // 这里的 outfits.map 逻辑之前曾报过 ReferenceError，现在已确保 outfits 已定义
  const categories = ["全部", ...new Set(outfits
    .filter(o => o && o.category) // 确保 o 和 o.category 存在
    .map(o => o.category)
    .filter(c => c && c !== "全部" && c !== "智能识图中..."))];

  const filteredOutfits = outfits.filter(o => {
    const matchCat = filter === "全部" || o.category === filter;
    const matchSeason = seasonFilter === "全部" || o.season === seasonFilter;
    const matchSearch = !searchQuery ||
      o.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSeason && matchSearch;
  });

  const analyzeImage = async (img) => {
    setAiLoading(true);
    const rules = localStorage.getItem("ai_rules") || "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ image: img, customRules: rules }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setAiResult(data);
    } catch (err) { console.error("分析失败", err); }
    finally { setAiLoading(false); }
  };

  const handleQuickAdd = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCaptureImage(reader.result);
        analyzeImage(reader.result);
        setIsCapturing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveFromHome = async () => {
    if (!captureImage || !aiResult) return;
    setAiLoading(true);

    try {
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co');
      console.log("准备进入保存流程...", { hasSupabase });
      let finalImageUrl = captureImage;

      // 如果配置了 Supabase，则上传图片到云端

      if (hasSupabase) {
        console.log("正在上传图片到存储桶...");
        const uploadedUrl = await uploadImage(captureImage);
        console.log("图片上传完成:", uploadedUrl);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const newOutfit = {
        image_url: finalImageUrl,
        category: aiResult.category,
        description: aiResult.description,
        tags: aiResult.tags || [],
        season: aiResult.season,
        location: location || "本地",
      };

      if (hasSupabase) {
        console.log("正在保存数据记录到数据库...");
        const saved = await saveOutfit(newOutfit);
        console.log("数据库保存成功:", saved);
        setOutfits([saved, ...outfits]);
      } else {
        // 本地降级存储
        if (typeof window !== "undefined") {
          const localOutfit = { ...newOutfit, id: Date.now(), image: finalImageUrl };
          const updated = [localOutfit, ...outfits];
          setOutfits(updated);
          localStorage.setItem("outfits", JSON.stringify(updated.slice().reverse()));
        }
      }
      closeCapture();
    } catch (err) {
      alert("保存失败，请检查网络");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const closeCapture = () => {
    setIsCapturing(false);
    setCaptureImage(null);
    setAiResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `我的穿搭单品: ${item.category}`,
          text: item.description,
          url: window.location.href,
        });
      } catch (err) { console.log("已取消分享"); }
    } else {
      navigator.clipboard.writeText(`${item.category}: ${item.description}`);
      alert("文案已复制到剪贴板");
    }
  };

  const generateXianyuCopy = async (item) => {
    setSharingItem(item);
    setAiLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          image: item.image,
          customRules: "作为闲鱼资深卖家，为这件衣服写一段标题和文案。包含成色描述、转手原因和建议价格。"
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setXianyuCopy(data.description);
    } catch (err) { console.error(err); }
    finally { setAiLoading(false); }
  };

  const handleDelete = (id) => {
    if (confirm("确定要删除这件单品吗？")) {
      const updated = outfits.filter(o => o.id !== id);
      setOutfits(updated);
      localStorage.setItem("outfits", JSON.stringify(updated.slice().reverse()));
      setEditingItem(null);
    }
  };

  const handleUpdate = (updatedItem) => {
    const updated = outfits.map(o => o.id === updatedItem.id ? updatedItem : o);
    setOutfits(updated);
    localStorage.setItem("outfits", JSON.stringify(updated.slice().reverse()));
    setEditingItem(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="搜索穿搭、风格、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.addTrigger} onClick={() => fileInputRef.current.click()}>＋</button>
          <input type="file" ref={fileInputRef} onChange={handleQuickAdd} accept="image/*" hidden />
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterBar}>
            {categories.map(cat => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${filter === cat ? styles.active : ""}`}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className={styles.waterfallGrid}>
        {(!mounted) ? (
          <div className={styles.loadingSkeleton}>加载中...</div>
        ) : filteredOutfits.length > 0 ? (
          filteredOutfits.map((item) => (
            <div key={item.id} className={styles.noteCard} onClick={() => setEditingItem(item)}>
              <div className={styles.noteCover}>
                <img src={item.image_url || item.image} alt={item.category} />
                {item.isAnalyzing && (
                  <div className={styles.analyzingOverlay}>
                    <div className={styles.pulseDot}></div>
                    <span>AI 正在全力识图...</span>
                  </div>
                )}
              </div>
              <div className={styles.noteContent}>
                <div className={styles.noteMainInfo}>
                  <h3 className={styles.noteTitle}>{item.category}</h3>
                  <p className={styles.noteDesc}>{item.description}</p>
                </div>
                <div className={styles.noteMeta}>
                  <div className={styles.tagRow}>
                    {item.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); handleShare(item); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3V16M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M20 11V17C20 19.2091 18.2091 21 16 21H8C5.79086 21 4 19.2091 4 17V11C4 8.79086 5.79086 7 8 7H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); generateXianyuCopy(item); }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 6V18M15 9H10.5C9.67157 9 9 9.67157 9 10.5C9 11.3284 9.67157 12 10.5 12H13.5C14.3284 12 15 12.6716 15 13.5C15 14.3284 14.3284 15 13.5 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIcon}>🧥</div>
            <h3>您的衣橱还是空的</h3>
            <p>点击右上角的 “＋” 号，让 AI 为您打理第一件穿搭吧！</p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingItem && (
        <div className={styles.modalOverlay} onClick={() => setEditingItem(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div
              className={styles.modalImage}
              style={{ backgroundImage: `url(${editingItem.image_url || editingItem.image})` }}
            />
            <div className={styles.modalForm}>
              <button className={styles.closeBtn} onClick={() => setEditingItem(null)}>✕</button>
              <div className={styles.modalMeta}>
                <span>📍 {editingItem.location || "附近"}</span>
                <span>⏰ {editingItem.date || "刚刚"}</span>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>单品名称</label>
                  <input
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>季节</label>
                  <select
                    value={editingItem.season}
                    onChange={e => setEditingItem({ ...editingItem, season: e.target.value })}
                    className={styles.select}
                  >
                    <option value="春">春</option>
                    <option value="夏">夏</option>
                    <option value="秋">秋</option>
                    <option value="冬">冬</option>
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>详细描述</label>
                <textarea
                  value={editingItem.description}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.deleteAction} onClick={() => handleDelete(editingItem.id)}>确认删除</button>
                <button className={styles.saveAction} onClick={() => handleUpdate(editingItem)}>保存修改</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capture Overlay */}
      {isCapturing && (
        <div className={styles.modalOverlay} style={{ zIndex: 3000 }}>
          <div className={styles.capturePanel}>
            <div className={styles.capturePreview}>
              <img src={captureImage} alt="Preview" style={{ width: '100%', height: 'auto' }} />
            </div>
            <div className={styles.captureInfo}>
              <div className={styles.aiBrief}><span>✨</span> 豆包正在识图中...</div>
              <div className={styles.captureResult} style={{ minHeight: '60px' }}>
                {aiLoading ? (
                  <p>正在解构服装款式，请稍等...</p>
                ) : (
                  <>
                    <h2 className={styles.resTitle}>{aiResult?.category}</h2>
                    <p className={styles.resDesc}>{aiResult?.description}</p>
                  </>
                )}
              </div>
            </div>
            <div className={styles.modalActions} style={{ padding: '0 20px 20px' }}>
              <button
                className={styles.saveAction}
                onClick={saveFromHome}
                disabled={aiLoading || !aiResult}
              >
                {aiLoading ? "计算中..." : "确认存入衣橱"}
              </button>
              <button className={styles.cancelLink} onClick={closeCapture} style={{ background: 'none' }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Xianyu Overlay */}
      {sharingItem && (
        <div className={styles.modalOverlay} style={{ zIndex: 4000 }}>
          <div className={styles.xianyuPanel}>
            <div className={styles.xianyuHeader}><span>💰</span> <h3>闲鱼推荐文案</h3></div>
            <div className={styles.xianyuBody}>
              {aiLoading ? (
                <p>正在为您生成高转化转卖文案...</p>
              ) : (
                <textarea readOnly value={xianyuCopy} className={styles.copyText} />
              )}
            </div>
            <div className={styles.modalActions} style={{ padding: '0 20px 20px' }}>
              <button
                className={styles.saveAction}
                onClick={() => {
                  navigator.clipboard.writeText(xianyuCopy);
                  alert("文案已复制，请前往闲鱼粘贴发布！");
                }}
              >
                复制并关闭
              </button>
              <button className={styles.cancelLink} onClick={() => setSharingItem(null)} style={{ background: 'none' }}>返回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
