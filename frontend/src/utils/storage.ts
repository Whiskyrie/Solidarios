/**
 * Utilitário para gerenciamento de armazenamento local
 * Usa AsyncStorage para persistência de dados em React Native
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Prefixo para todas as chaves de armazenamento
 */
const STORAGE_PREFIX = "@solidarios:";

/**
 * Classe utilitária para gerenciamento de armazenamento
 */
class StorageUtil {
  /**
   * Salva um item no armazenamento local
   * @param key Chave para o item
   * @param value Valor a ser armazenado
   * @returns Promise resolvida após a operação
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(storageKey, jsonValue);
    } catch (error) {
      console.error("Erro ao salvar no storage:", error);
      throw error;
    }
  }

  /**
   * Recupera um item do armazenamento local
   * @param key Chave do item
   * @param defaultValue Valor padrão caso não exista
   * @returns Promise com o valor recuperado ou o padrão
   */
  async getItem<T>(
    key: string,
    defaultValue: T | null = null
  ): Promise<T | null> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const jsonValue = await AsyncStorage.getItem(storageKey);

      if (jsonValue === null) {
        return defaultValue;
      }

      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error("Erro ao recuperar do storage:", error);
      return defaultValue;
    }
  }

  /**
   * Remove um item do armazenamento local
   * @param key Chave do item
   * @returns Promise resolvida após a operação
   */
  async removeItem(key: string): Promise<void> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Erro ao remover do storage:", error);
      throw error;
    }
  }

  /**
   * Limpa todos os itens do armazenamento local criados por esta aplicação
   * @returns Promise resolvida após a operação
   */
  async clear(): Promise<void> {
    try {
      // Obter todas as chaves do AsyncStorage
      const keys = await AsyncStorage.getAllKeys();

      // Filtrar apenas as chaves com o prefixo da aplicação
      const appKeys = keys.filter((key) => key.startsWith(STORAGE_PREFIX));

      // Remover todas as chaves da aplicação
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }
    } catch (error) {
      console.error("Erro ao limpar o storage:", error);
      throw error;
    }
  }

  /**
   * Verifica se um item existe no armazenamento local
   * @param key Chave do item
   * @returns Promise com verdadeiro se existir, falso caso contrário
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const value = await AsyncStorage.getItem(storageKey);
      return value !== null;
    } catch (error) {
      console.error("Erro ao verificar existência no storage:", error);
      return false;
    }
  }

  /**
   * Obtém todas as chaves de armazenamento da aplicação
   * @returns Promise com array de chaves
   */
  async getAllKeys(): Promise<string[]> {
    try {
      // Obter todas as chaves do AsyncStorage
      const keys = await AsyncStorage.getAllKeys();

      // Filtrar apenas as chaves com o prefixo da aplicação e remover o prefixo
      return keys
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .map((key) => key.replace(STORAGE_PREFIX, ""));
    } catch (error) {
      console.error("Erro ao obter chaves do storage:", error);
      return [];
    }
  }

  /**
   * Adiciona um item a um array armazenado
   * @param key Chave do array
   * @param item Item a ser adicionado
   * @returns Promise resolvida após a operação
   */
  async addToArray<T>(key: string, item: T): Promise<T[]> {
    try {
      // Recuperar o array atual
      const currentArray = await this.getItem<T[]>(key, []);

      // Adicionar o novo item
      const newArray = [...(currentArray || []), item];

      // Salvar o array atualizado
      await this.setItem(key, newArray);

      return newArray;
    } catch (error) {
      console.error("Erro ao adicionar ao array no storage:", error);
      throw error;
    }
  }

  /**
   * Remove um item de um array armazenado usando um predicado
   * @param key Chave do array
   * @param predicate Função para identificar o item a ser removido
   * @returns Promise com array atualizado
   */
  async removeFromArray<T>(
    key: string,
    predicate: (item: T) => boolean
  ): Promise<T[]> {
    try {
      // Recuperar o array atual
      const currentArray = await this.getItem<T[]>(key, []);

      if (!currentArray) {
        return [];
      }

      // Filtrar o array para remover o item
      const newArray = currentArray.filter((item) => !predicate(item));

      // Salvar o array atualizado
      await this.setItem(key, newArray);

      return newArray;
    } catch (error) {
      console.error("Erro ao remover do array no storage:", error);
      throw error;
    }
  }

  /**
   * Atualiza um item em um array armazenado
   * @param key Chave do array
   * @param predicate Função para identificar o item a ser atualizado
   * @param updater Função para atualizar o item
   * @returns Promise com array atualizado
   */
  async updateInArray<T>(
    key: string,
    predicate: (item: T) => boolean,
    updater: (item: T) => T
  ): Promise<T[]> {
    try {
      // Recuperar o array atual
      const currentArray = await this.getItem<T[]>(key, []);

      if (!currentArray) {
        return [];
      }

      // Mapear o array para atualizar o item
      const newArray = currentArray.map((item) =>
        predicate(item) ? updater(item) : item
      );

      // Salvar o array atualizado
      await this.setItem(key, newArray);

      return newArray;
    } catch (error) {
      console.error("Erro ao atualizar array no storage:", error);
      throw error;
    }
  }
}

// Exportar uma instância única
const storage = new StorageUtil();
export default storage;
