"use client";
import { useState, useEffect } from "react";
import styles from "./settings.module.css";
import { useRouter } from "next/navigation";

export default function Settings() {
    const [rules, setRules] = useState("");
    const [saved, setSaved] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedRules = localStorage.getItem("ai_rules");
            if (savedRules) setRules(savedRules);
        }
    }, []);

    const handleSave = () => {
        if (typeof window !== "undefined") {
            localStorage.setItem("ai_rules", rules);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.back()}>✕</button>
                <span className={styles.title}>AI 管家设定</span>
                <button className={styles.saveBtn} onClick={handleSave}>
                    {saved ? "已同步" : "保存"}
                </button>
            </header>

            <div className={styles.content}>
                <div className={styles.ruleBox}>
                    <p className={styles.label}>管家生成偏好 (Prompt Rules)</p>
                    <textarea
                        className={styles.textarea}
                        value={rules}
                        onChange={(e) => setRules(e.target.value)}
                        placeholder="例如：请用赞美的语气描述我的衣服，一定要提到颜色搭配的亮点..."
                    />
                </div>

                <div className={styles.helpCard}>
                    <h3 className={styles.sectionTitle}>💡 灵感提示</h3>
                    <ul className={styles.helpList}>
                        <li>“标注衣物材质与面料细节”</li>
                        <li>“为每件衣服推荐下周的天气搭配”</li>
                        <li>“使用活泼开朗、富有感染力的语气”</li>
                    </ul>
                </div>

                <div className={styles.aboutSection}>
                    <p>Outfit Mate v2.0</p>
                    <p>小红书风格 · 智享生活</p>
                </div>
            </div>
        </div>
    );
}
