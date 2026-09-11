export async function uploadClinicalFileToDrive(file: File, patientId: string) {
  return {
    id: `drive-${Date.now()}`,
    name: file.name,
    url: '',
    uploadedAt: new Date().toISOString(),
    size: `${Math.round(file.size / 1024)} KB`,
    patientId,
    simulated: true,
  };
}
