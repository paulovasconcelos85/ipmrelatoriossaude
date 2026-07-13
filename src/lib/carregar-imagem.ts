/**
 * Busca uma imagem (asset estático ou URL remota, ex.: Supabase Storage) e converte
 * para data URL base64, formato que `jsPDF.addImage()` exige (ele não busca URLs sozinho).
 */
export async function carregarImagemComoDataUrl(url: string): Promise<string> {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao carregar imagem: ${url}`);
  const blob = await resposta.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error(`Falha ao ler imagem: ${url}`));
    reader.readAsDataURL(blob);
  });
}
