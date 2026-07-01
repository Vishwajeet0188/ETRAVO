import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/auth";
import type {
  LoginInput,
  RegisterInput,
  User,
} from "../types/user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  // logout: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
   console.log("AUTH PROVIDER MOUNTED");
  // const [user, setUser] = useState<User | null>(() => {
  // const saved = localStorage.getItem("user");
  //   return saved ? JSON.parse(saved) : null;
  // });

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);


  useEffect(() => {
  const loadAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem("token");
      const savedUser = await AsyncStorage.getItem("user");

      if (savedToken) {
        setToken(savedToken);
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load auth data", error);
    }
  };

  loadAuth();
}, []);


  // const [token, setToken] = useState<string | null>(
  //   () => localStorage.getItem("token")
  // );

  // useEffect(() => {
  //   if (token) {
  //     localStorage.setItem("token", token);
  //   } else {
  //     localStorage.removeItem("token");
  //   }
  // }, [token]);

  // useEffect(() => {
  //   if (user) {
  //     localStorage.setItem("user", JSON.stringify(user));
  //   } else {
  //     localStorage.removeItem("user");
  //   }
  // }, [user]);

  useEffect(() => {
  const saveToken = async () => {
    if (token) {
      await AsyncStorage.setItem("token", token);
    } else {
      await AsyncStorage.removeItem("token");
    }
  };

  saveToken();
}, [token]);

useEffect(() => {
  const saveUser = async () => {
    if (user) {
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    } else {
      await AsyncStorage.removeItem("user");
    }
  };

  saveUser();
}, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      login: async (input) => {
        const result = await authService.login(input);
        setUser(result.user);
        setToken(result.token);
        return result.user;
      },
      register: async (input) => {
        const result = await authService.register(input);
        setUser(result.user);
        setToken(result.token);
        return result.user;
      },
      // logout: () => {
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("user");

      //   setUser(null);
      //   setToken(null);
      // },
      logout: async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");

        setUser(null);
        setToken(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
