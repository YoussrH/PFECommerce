import axios from "axios";

const BASE_URL = "https://api.aladhan.com/v1";

export const recupererEvenementsIslamiques = async (ville = "Tunis", pays = "Tunisie") => {
  try {
    const aujourdHui = new Date();
    const annee = aujourdHui.getFullYear();
    const mois = aujourdHui.getMonth() + 1;

    const reponse = await axios.get(`${BASE_URL}/gToHCalendar/${mois}/${annee}`, {
      params: {
        city: ville,
        country: pays,
        method: 2,
      },
    });

    const evenements = reponse.data.data
      .map((item) => {
        const hijri = item.hijri;
        const dateGr = item.gregorian.date;
        const nomEvenement = hijri.holidays?.[0];
        return nomEvenement
          ? {
              date_gr: dateGr,
              date_hijri: hijri.date,
              nom: nomEvenement,
            }
          : null;
      })
      .filter(Boolean); // Supprime les entrées null

    return evenements;
  } catch (erreur) {
    console.error("Erreur lors de la récupération des événements islamiques :", erreur.message);
    return [];
  }
};
