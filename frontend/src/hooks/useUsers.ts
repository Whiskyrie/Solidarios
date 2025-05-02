/**
 * Hook personalizado para gerenciamento de usuários
 */
import { useCallback, useState } from "react";
import UsersService from "../api/users";
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UsersPage,
  UserRole,
} from "../types/users.types";
import { PageOptionsDto } from "../types/common.types";

// Hook para gerenciamento de usuários
export const useUsers = () => {
  // Estados locais
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    totalPages: number;
    totalItems: number;
  }>({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  // Função para limpar erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Função para obter todos os usuários com paginação
  const fetchUsers = useCallback(async (pageOptions?: PageOptionsDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await UsersService.getAll(pageOptions);
      setUsers(response.data);
      setPagination({
        page: response.meta.page,
        totalPages: response.meta.pageCount,
        totalItems: response.meta.itemCount,
      });
      return response;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar usuários");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter um usuário por ID
  const fetchUserById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await UsersService.getById(id);
      setUser(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao buscar usuário");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para criar um novo usuário
  const createUser = useCallback(async (userData: CreateUserDto) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await UsersService.create(userData);
      setUser(data);
      // Atualizar a lista de usuários se necessário
      setUsers((prev) => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para atualizar um usuário existente
  const updateUser = useCallback(
    async (id: string, userData: UpdateUserDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await UsersService.update(id, userData);
        setUser(data);
        // Atualizar a lista de usuários se necessário
        setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
        return data;
      } catch (err: any) {
        setError(err.message || "Erro ao atualizar usuário");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para remover um usuário
  const removeUser = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await UsersService.remove(id);
      // Atualizar a lista de usuários
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao remover usuário");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para obter usuários por perfil
  const fetchUsersByRole = useCallback(
    async (role: UserRole, pageOptions?: PageOptionsDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await UsersService.getByRole(role, pageOptions);
        setUsers(response.data);
        setPagination({
          page: response.meta.page,
          totalPages: response.meta.pageCount,
          totalItems: response.meta.itemCount,
        });
        return response;
      } catch (err: any) {
        setError(err.message || "Erro ao buscar usuários por perfil");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Função para ativar/desativar um usuário
  const toggleUserActive = useCallback(
    async (id: string, isActive: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await UsersService.toggleActive(id, isActive);
        setUser(data);
        // Atualizar a lista de usuários se necessário
        setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
        return data;
      } catch (err: any) {
        setError(
          err.message || `Erro ao ${isActive ? "ativar" : "desativar"} usuário`
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Retornar as funções e estado
  return {
    // Estado
    users,
    user,
    isLoading,
    error,
    pagination,

    // Ações
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    removeUser,
    fetchUsersByRole,
    toggleUserActive,
    clearError,
  };
};

export default useUsers;
