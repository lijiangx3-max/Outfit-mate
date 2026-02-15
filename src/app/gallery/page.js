"use client";
import { useState, useEffect } from "react";
import styles from "./gallery.module.css";

export default function Gallery() {
    const [outfits, setOutfits] = useState([]);
    const [filter, setFilter] = useState("全部");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("outfits");
            if (saved) setOutfits(JSON.parse(saved).reverse());
        }
    }, []);

    const categories = ["全部", ...new Set(outfits.map(o => o.category))];

    const filteredOutfits = filter === "全部"
        ? outfits
        : outfits.filter(o => o.category === filter);

    const deleteOutfit = (id) => {
        if (typeof window !== "undefined" && confirm("确定要移出衣橱吗？")) {
            const updated = outfits.filter(o => o.id !== id);
            setOutfits(updated);
            localStorage.setItem("outfits", JSON.stringify(updated.slice().reverse()));
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>我的时尚库</h1>
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
            </header>

            <main className={styles.galleryGrid}>
                {filteredOutfits.map((item) => (
                    <div key={item.id} className={styles.noteCard}>
                        <div
                            className={styles.imageBox}
                            style={{ backgroundImage: `url(${item.image})` }}
                        />
                        <div className={styles.cardContent}>
                            <h3 className={styles.noteTitle}>{item.category}</h3>
                            <div className={styles.tagRow}>
                                {item.tags?.slice(0, 2).map(tag => (
                                    <span key={tag} className={styles.tag}>#{tag}</span>
                                ))}
                            </div>
                            <div className={styles.footer}>
                                <span className={styles.date}>{new Date(item.date).toLocaleDateString()}</span>
                                <button className={styles.deleteBtn} onClick={() => deleteOutfit(item.id)}>🗑️</button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>

            {filteredOutfits.length === 0 && (
                <div className={styles.emptyState}>
                    暂时没有发现相关穿搭
                </div>
            )}
        </div>
    );
}
