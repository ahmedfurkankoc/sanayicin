import { useState, useEffect, useCallback } from 'react';

interface TurkeyData {
  getCityNames: () => string[];
  getDistrictsByCityCode: (cityCode: string) => string[];
  getNeighbourhoodsByCityCodeAndDistrict: (cityCode: string, district: string) => string[];
  cityCodeMap: Map<string, string>;
  cityNames: string[];
}

export const useTurkeyData = () => {
  const [turkeyData, setTurkeyData] = useState<TurkeyData | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTurkeyData = async () => {
    if (!turkeyData && !isLoading) {
      setIsLoading(true);
      
      try {
        const { getCityNames, getDistrictsByCityCode, getNeighbourhoodsByCityCodeAndDistrict, getCities } = await import('turkey-neighbourhoods');
        
        const cityNames = getCityNames();
        const citiesData = getCities();
        
        // Şehir adından plaka kodunu bulmak için map oluştur
        const cityCodeMap = new Map<string, string>();
        citiesData.forEach((city: any) => {
          cityCodeMap.set(city.name, city.code);
        });
        
        const turkeyDataObj: TurkeyData = { 
          getCityNames, 
          getDistrictsByCityCode, 
          getNeighbourhoodsByCityCodeAndDistrict,
          cityCodeMap,
          cityNames
        };
        
        setTurkeyData(turkeyDataObj);
        
        // İstanbul, Ankara ve İzmir'i en yukarıda tut, geri kalanları alfabetik sırala
        const priorityCities = ['İstanbul', 'Ankara', 'İzmir'];
        const otherCities = cityNames.filter(city => !priorityCities.includes(city)).sort();
        const sortedCities = [...priorityCities, ...otherCities];
        
        setCities(sortedCities);
        
      } catch (error) {
        console.error('Turkey data yüklenirken hata:', error);
        // Fallback: Manuel şehir listesi - İstanbul, Ankara, İzmir en yukarıda
        const fallbackCities = ["İstanbul", "Ankara", "İzmir", "Adana", "Antalya", "Bursa", "Diyarbakır", "Gaziantep", "Konya", "Mersin"];
        setCities(fallbackCities);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getDistricts = useCallback((cityName: string): string[] => {
    if (!turkeyData || !cityName) return [];
    try {
      const cityCode = turkeyData.cityCodeMap.get(cityName);
      if (cityCode) {
        const districts = turkeyData.getDistrictsByCityCode(cityCode);
        console.log(`İlçeler yüklendi: ${cityName} için ${districts.length} ilçe`);
        return districts;
      }
    } catch (error) {
      console.error('İlçeler alınırken hata:', error);
    }
    return [];
  }, [turkeyData]);

  const getNeighbourhoods = useCallback((cityName: string, districtName: string): string[] => {
    if (!turkeyData || !cityName || !districtName) return [];
    try {
      const cityCode = turkeyData.cityCodeMap.get(cityName);
      if (cityCode) {
        const neighbourhoods = turkeyData.getNeighbourhoodsByCityCodeAndDistrict(cityCode, districtName);
        console.log(`Semtler yüklendi: ${cityName} - ${districtName} için ${neighbourhoods.length} semt`);
        return neighbourhoods;
      }
    } catch (error) {
      console.error('Semtler alınırken hata:', error);
    }
    return [];
  }, [turkeyData]);

  return {
    cities,
    turkeyData,
    isLoading,
    loadTurkeyData,
    getDistricts,
    getNeighbourhoods
  };
};
