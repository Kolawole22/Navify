export interface SelectOption {
  label: string;
  value: string;
}

// Sample data for dropdowns
export const STATES: SelectOption[] = [
  { label: "Abia", value: "abia" },
  { label: "Adamawa", value: "adamawa" },
  { label: "Akwa Ibom", value: "akwa_ibom" },
  { label: "Anambra", value: "anambra" },
  { label: "Bauchi", value: "bauchi" },
  { label: "Bayelsa", value: "bayelsa" },
  { label: "Benue", value: "benue" },
  { label: "Borno", value: "borno" },
  { label: "Cross River", value: "cross_river" },
  { label: "Delta", value: "delta" },
  { label: "Ebonyi", value: "ebonyi" },
  { label: "Edo", value: "edo" },
  { label: "Ekiti", value: "ekiti" },
  { label: "Enugu", value: "enugu" },
  { label: "FCT", value: "fct" },
  { label: "Gombe", value: "gombe" },
  { label: "Imo", value: "imo" },
  { label: "Jigawa", value: "jigawa" },
  { label: "Kaduna", value: "kaduna" },
  { label: "Kano", value: "kano" },
  { label: "Katsina", value: "katsina" },
  { label: "Kebbi", value: "kebbi" },
  { label: "Kogi", value: "kogi" },
  { label: "Kwara", value: "kwara" },
  { label: "Lagos", value: "lagos" },
  { label: "Nasarawa", value: "nasarawa" },
  { label: "Niger", value: "niger" },
  { label: "Ogun", value: "ogun" },
  { label: "Ondo", value: "ondo" },
  { label: "Osun", value: "osun" },
  { label: "Oyo", value: "oyo" },
  { label: "Plateau", value: "plateau" },
  { label: "Rivers", value: "rivers" },
  { label: "Sokoto", value: "sokoto" },
  { label: "Taraba", value: "taraba" },
  { label: "Yobe", value: "yobe" },
  { label: "Zamfara", value: "zamfara" },
];

// Sample LGA data
export const getLGAsByState = (state: string): SelectOption[] => {
  switch (state) {
    case "lagos":
      return [
        { label: "Alimosho", value: "alimosho" },
        { label: "Ajeromi-Ifelodun", value: "ajeromi_ifelodun" },
        { label: "Kosofe", value: "kosofe" },
        { label: "Mushin", value: "mushin" },
        { label: "Oshodi-Isolo", value: "oshodi_isolo" },
        { label: "Ojo", value: "ojo" },
        { label: "Ikorodu", value: "ikorodu" },
        { label: "Surulere", value: "surulere" },
        { label: "Agege", value: "agege" },
        { label: "Ifako-Ijaiye", value: "ifako_ijaiye" },
        { label: "Shomolu", value: "shomolu" },
        { label: "Amuwo-Odofin", value: "amuwo_odofin" },
        { label: "Lagos Mainland", value: "lagos_mainland" },
        { label: "Ikeja", value: "ikeja" },
        { label: "Eti-Osa", value: "eti_osa" },
        { label: "Badagry", value: "badagry" },
        { label: "Apapa", value: "apapa" },
        { label: "Lagos Island", value: "lagos_island" },
        { label: "Epe", value: "epe" },
        { label: "Ibeju-Lekki", value: "ibeju_lekki" },
      ];
    case "fct":
      return [
        { label: "Abaji", value: "abaji" },
        { label: "Bwari", value: "bwari" },
        { label: "Gwagwalada", value: "gwagwalada" },
        { label: "Kuje", value: "kuje" },
        { label: "Kwali", value: "kwali" },
        { label: "Municipal Area Council", value: "municipal" },
      ];
    default:
      return [
        { label: "Example LGA 1", value: "lga1" },
        { label: "Example LGA 2", value: "lga2" },
        { label: "Example LGA 3", value: "lga3" },
      ];
  }
};

// Sample cities data by LGA
export const getCitiesByLGA = (lga: string): SelectOption[] => {
  // This would typically be a more complex function with real data
  // Here we're just creating some sample data
  return [
    { label: `${lga} City 1`, value: `${lga}_city1` },
    { label: `${lga} City 2`, value: `${lga}_city2` },
    { label: `${lga} City 3`, value: `${lga}_city3` },
    { label: `${lga} Town 1`, value: `${lga}_town1` },
    { label: `${lga} Town 2`, value: `${lga}_town2` },
  ];
};
