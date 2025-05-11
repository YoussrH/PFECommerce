import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const formatDate = (dateString) => {
  return format(new Date(dateString), "PPpp", { locale: fr });
};