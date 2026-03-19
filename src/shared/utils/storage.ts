import Cookies from "js-cookie";

const TOKEN_KEY = "derash_token";

export const setToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, { expires: 1 / 24 }); // 1 hour
};

export const getToken = () => {
  return Cookies.get(TOKEN_KEY);
};

export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
};