async function uploadImage(file, path = "") {
  const filePath = path || `images/${file.name}`;

  const { data, error } = await window.supabase.storage
    .from("webkost-images") // nama bucket
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) throw error;

  const { data: publicUrlData } = window.supabase.storage
    .from("webkost-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

window.uploadApi = { uploadImage };
