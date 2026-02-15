import { supabase } from './supabase';

/**
 * 将图片上传到 Supabase Storage
 * @param {string} base64Data 图片的 base64 字符串
 */
export const uploadImage = async (base64Data) => {
    try {
        const fileName = `${Date.now()}.png`;
        // 将 Base64 转换为 Blob
        const res = await fetch(base64Data);
        const blob = await res.blob();

        const { data, error } = await supabase.storage
            .from('outfit-images')
            .upload(fileName, blob, { contentType: 'image/png' });

        if (error) throw error;

        // 获取公开访问链接
        const { data: { publicUrl } } = supabase.storage
            .from('outfit-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('上传图片失败:', error);
        return null;
    }
};

/**
 * 将穿搭信息保存到数据库
 */
export const saveOutfit = async (outfitData) => {
    const { data, error } = await supabase
        .from('outfits')
        .insert([outfitData])
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * 获取所有穿搭
 */
export const fetchOutfits = async () => {
    const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
