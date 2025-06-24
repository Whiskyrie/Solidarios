// hooks/usePhotoUpload.ts
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";

interface Photo {
  uri: string;
  name: string;
  type: string;
}

interface UsePhotoUploadOptions {
  maxPhotos?: number;
  onPhotoAdded?: (photo: Photo) => void;
  onPhotoRemoved?: (index: number) => void;
  onError?: (error: string) => void;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const { maxPhotos = 5, onPhotoAdded, onPhotoRemoved, onError } = options;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Verificar permissões
  const checkPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      onError?.("Permissão de acesso à galeria é necessária");
      return false;
    }

    return true;
  }, [onError]);

  // Adicionar foto
  const addPhoto = useCallback(async () => {
    if (photos.length >= maxPhotos) {
      onError?.(`Máximo de ${maxPhotos} fotos permitidas`);
      return;
    }

    const hasPermission = await checkPermissions();
    if (!hasPermission) return;

    setIsUploading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const photo: Photo = {
          uri: asset.uri,
          name: asset.uri.split("/").pop() || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || "image/jpeg",
        };

        setPhotos((prev) => {
          const newPhotos = [...prev, photo];
          onPhotoAdded?.(photo);
          return newPhotos;
        });
      }
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      onError?.("Erro ao selecionar foto");
    } finally {
      setIsUploading(false);
    }
  }, [photos.length, maxPhotos, checkPermissions, onPhotoAdded, onError]);

  // Remover foto
  const removePhoto = useCallback(
    (index: number) => {
      if (index < 0 || index >= photos.length) return;

      setPhotos((prev) => {
        const newPhotos = prev.filter((_, i) => i !== index);
        onPhotoRemoved?.(index);
        return newPhotos;
      });
    },
    [photos.length, onPhotoRemoved]
  );

  // Limpar todas as fotos
  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  // Preparar FormData para upload
  const prepareFormData = useCallback((): FormData | null => {
    if (photos.length === 0) return null;

    const formData = new FormData();

    photos.forEach((photo, _index) => {
      formData.append("files", {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as any);
    });

    return formData;
  }, [photos]);

  return {
    // Estado
    photos,
    isUploading,
    hasPhotos: photos.length > 0,
    canAddMore: photos.length < maxPhotos,
    photosCount: photos.length,

    // Ações
    addPhoto,
    removePhoto,
    clearPhotos,
    prepareFormData,
    checkPermissions,
  };
};
