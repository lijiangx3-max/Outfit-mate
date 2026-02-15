"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./capture.module.css";
import { useRouter } from "next/navigation";

export default function Capture() {
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [location, setLocation] = useState("未知地点");
    const [savedCount, setSavedCount] = useState(0);
    const fileInputRef = useRef(null);
    const router = useRouter();

    // 自动获取位置
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation(`经度:${pos.coords.longitude.toFixed(2)} 纬度:${pos.coords.latitude.toFixed(2)}`);
            }, () => setLocation("本地"));
        }
    }, []);

    // 拍照/上传后自动触发 AI 分析
    useEffect(() => {
        if (image) {
            analyzeImage();
        }
    }, [image]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        setLoading(true);
        const currentRules = typeof window !== "undefined" ? localStorage.getItem("ai_rules") || "" : "";
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                body: JSON.stringify({ image, customRules: currentRules }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error("AI 分析失败:", err);
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setImage(null);
        setResult(null);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const saveOutfit = () => {
        if (!image || !result) return;

        if (typeof window === "undefined") return;
        const saved = JSON.parse(localStorage.getItem("outfits") || "[]");
        const newOutfit = {
            id: Date.now(),
            image,
            ...result,
            location,
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            timestamp: new Date().toISOString()
        };
        localStorage.setItem("outfits", JSON.stringify([...saved, newOutfit]));

        setSavedCount(prev => prev + 1);
        resetState();
        setTimeout(() => setSavedCount(0), 2000);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push("/")}>返回</button>
                <span className={styles.title}>记录时刻</span>
                <span className={styles.aiBadge}>AI 智能模式</span>
            </header>

            <div className={styles.content}>
                {savedCount > 0 && (
                    <div className={styles.successToast}>
                        ✨ 已成功存入衣橱 ({savedCount})
                    </div>
                )}

                {!image ? (
                    <div className={styles.cameraSection}>
                        <div className={styles.cameraCircle} onClick={() => fileInputRef.current.click()}>
                            <div className={styles.cameraIcon}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="white"/>
                                    <path fillRule="evenodd" clipRule="evenodd" d="M7.33464 4.54287C7.69738 3.61904 8.58332 3 9.57143 3H14.4286C15.4167 3 16.3026 3.61904 16.6654 4.54287L17.234 5.99H20C21.1046 5.99 22 6.88541 22 7.99V17.99C22 19.0946 21.1046 19.99 20 19.99H4C2.89543 19.99 2 19.0946 2 17.99V7.99C2 6.88541 2.89543 5.99 4 5.99H6.766L7.33464 4.54287ZM12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="white"/>
                                </svg>
                            </div>
                            <p>拍摄或上传穿搭</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className={styles.analysisView}>
                        <div className={styles.previewContainer}>
                            <img src={image} className={styles.fullPreview} alt="Preview" />
                        </div>

                        <div className={styles.resultDetails}>
                            <div className={styles.aiHeader}>
                                <span className={styles.sparkleIcon}>✨</span>
                                AI 智能分析结果
                            </div>

                            <div className={styles.metaRow}>
                                <span>📍 {location}</span>
                                <span>⏰ {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className={styles.field}>
                                {loading ? (
                                    <div className={styles.skeletonTitle}>正在识别分类...</div>
                                ) : (
                                    <h2 className={styles.resultTitle}>
                                        {result?.category}
                                        {result?.season && <span className={styles.seasonTag}>{result.season}季</span>}
                                    </h2>
                                )}
                            </div>

                            <div className={styles.field}>
                                {loading ? (
                                    <div className={styles.skeletonText}>管家正在组织优雅的描述语言...</div>
                                ) : (
                                    <p className={styles.resultDesc}>{result?.description}</p>
                                )}
                            </div>

                            {!loading && result && (
                                <>
                                    <div className={styles.tagList}>
                                        {result.tags?.map(t => <span key={t} className={styles.tagItem}>#{t}</span>)}
                                    </div>
                                    <div className={styles.suggestionBox}>
                                        <p className={styles.label}>穿搭建议：</p>
                                        <p>{result.suggestion}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className={styles.actionFixed}>
                            <button
                                className={styles.mainSaveBtn}
                                onClick={saveOutfit}
                                disabled={loading || !result}
                            >
                                {loading ? "管家分析中..." : "确认存入衣橱"}
                            </button>
                            <button className={styles.cancelLink} onClick={resetState}>放弃，重新拍摄</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
