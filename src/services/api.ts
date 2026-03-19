import axios from "axios";

const api = axios.create({
  baseURL: "", // leave empty for MSW (mock backend)
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;