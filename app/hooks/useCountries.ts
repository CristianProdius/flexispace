import countries from "world-countries";

interface FormattedCountry {
   value: string;
   label: string;
   flag: string;
   latlng: [number, number];
   region: string;
}

const formatedCountries: FormattedCountry[] = countries.map((country) => ({
   value: country.cca2,
   label: country.name.common,
   flag: country.flag,
   latlng: country.latlng,
   region: country.region,
}));

const useCountries = () => {
   const getAll = () => formatedCountries;
   const getByValue = (value: string) => {
      return formatedCountries.find((item) => item.value === value);
   };
   return {
      getAll,
      getByValue,
   };
};

export default useCountries;
