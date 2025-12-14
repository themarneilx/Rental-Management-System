
export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error('IMGBB_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', apiKey);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to upload to ImgBB');
  }

  return data.data.url;
}
