import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  FlatList,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useFormikContext, getIn } from "formik";
import Typography from "../common/Typography";
import Button from "../common/Button";
import theme from "../../theme";

export interface FileUploadProps {
  name: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
  required?: boolean;
  maxFiles?: number;
  accept?: "images" | "all";
  multiple?: boolean;
}

export interface FileInfo {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label = "Arquivos",
  style,
  required = false,
  maxFiles = 5,
  accept = "images",
  multiple = true,
}) => {
  const [uploading, setUploading] = useState(false);

  // Integração com Formik
  const { values, setFieldValue, touched, errors } = useFormikContext<any>();
  const files = getIn(values, name) || [];
  const error = getIn(touched, name) && getIn(errors, name);

  // Solicitar permissões para acessar a galeria de imagens
  const requestPermissions = async () => {
    // Verificar e solicitar permissões de galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar sua galeria de imagens.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  // Função para selecionar imagens da galeria
  const handleSelectImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setUploading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          accept === "images"
            ? ImagePicker.MediaTypeOptions.Images
            : ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: multiple,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Limitar o número de arquivos
        const newAssets = result.assets.slice(0, maxFiles - files.length);

        // Transformar assets em FileInfo
        const newFiles: FileInfo[] = newAssets.map(
          (asset: ImagePicker.ImagePickerAsset) => ({
            uri: asset.uri,
            name: asset.uri.split("/").pop() || "image.jpg",
            type: asset.mimeType || "image/jpeg",
            size: asset.fileSize,
          })
        );

        // Atualizar o valor no Formik
        setFieldValue(name, [...files, ...newFiles]);
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao selecionar a imagem.");
      console.error("Error selecting image:", error);
    } finally {
      setUploading(false);
    }
  };

  // Função para tirar uma foto com a câmera
  const handleTakePhoto = async () => {
    // Verificar e solicitar permissões de câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de permissão para acessar sua câmera.",
        [{ text: "OK" }]
      );
      return;
    }

    setUploading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Transformar asset em FileInfo
        const newFile: FileInfo = {
          uri: asset.uri,
          name: asset.uri.split("/").pop() || "photo.jpg",
          type: "image/jpeg",
          size: asset.fileSize,
        };

        // Atualizar o valor no Formik
        setFieldValue(name, [...files, newFile]);
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao tirar a foto.");
      console.error("Error taking photo:", error);
    } finally {
      setUploading(false);
    }
  };

  // Função para remover um arquivo
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFieldValue(name, updatedFiles);
  };

  // Renderizar um item de arquivo (imagem)
  const renderFileItem = ({
    item,
    index,
  }: {
    item: FileInfo;
    index: number;
  }) => {
    return (
      <View style={styles.fileItem}>
        <Image source={{ uri: item.uri }} style={styles.fileImage} />

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFile(index)}
        >
          <Typography variant="small" color={theme.colors.neutral.white}>
            ✕
          </Typography>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Typography variant="bodySecondary" style={styles.label}>
          {label}
        </Typography>

        {required && (
          <Typography variant="bodySecondary" color={theme.colors.status.error}>
            *
          </Typography>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Selecionar da galeria"
          onPress={handleSelectImage}
          variant="secondary"
          size="small"
          style={styles.button}
          disabled={uploading || files.length >= maxFiles}
        />

        <Button
          title="Tirar foto"
          onPress={handleTakePhoto}
          variant="secondary"
          size="small"
          style={styles.button}
          disabled={uploading || files.length >= maxFiles}
        />
      </View>

      {files.length > 0 && (
        <FlatList
          data={files}
          renderItem={renderFileItem}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.fileList}
          contentContainerStyle={styles.fileListContent}
        />
      )}

      {error && (
        <Typography
          variant="small"
          color={theme.colors.status.error}
          style={styles.errorText}
        >
          {error}
        </Typography>
      )}

      <Typography
        variant="small"
        color={theme.colors.neutral.darkGray}
        style={styles.helpText}
      >
        {files.length}/{maxFiles} arquivos selecionados
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  label: {
    marginRight: theme.spacing.xxs,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.xs,
  },
  button: {
    marginRight: theme.spacing.s,
  },
  fileList: {
    marginTop: theme.spacing.xs,
  },
  fileListContent: {
    paddingHorizontal: theme.spacing.xxs,
  },
  fileItem: {
    width: 100,
    height: 100,
    marginRight: theme.spacing.xs,
    borderRadius: theme.borderRadius.small,
    overflow: "hidden",
    position: "relative",
  },
  fileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.status.error,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: theme.spacing.xxs,
  },
  helpText: {
    marginTop: theme.spacing.xxs,
  },
});

export default FileUpload;
