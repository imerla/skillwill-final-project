import type { Translations } from './LanguageContext'

/**
 * Translates API response data based on the current language
 * This is a temporary solution until the backend supports Accept-Language header
 */
export function translateApiData(text: string, t: Translations): string {
  const translations: Record<string, string> = {
    'ტანსაცმელი და ფეხსაცმელი': 'api.clothingAndFootwear',
    'ყოველდღიური და სპორტული ტანსაცმელი ქალებისა და მამაკაცებისთვის.': 'api.clothingAndFootwearDesc',
    'ვისთვის': 'api.forWhom',
    'ფერი': 'api.color',
    'ზომა': 'api.size',
    'ბრენდი': 'api.brand',
    'ფასი': 'api.price',
    'ტიპი': 'api.type',
    'სეზონი': 'api.season',
    'მასალა': 'api.material',
    'რეცხვა': 'api.washing',
    'წარმოება': 'api.manufacturer',
    'გარანტია': 'api.warranty',
    'ქალბატონები': 'api.women',
    'მამაკაცები': 'api.men',
    'უნისექსი': 'api.unisex',
    'ბავშვები': 'api.kids',
    'ქალის': 'api.womenPossessive',
    'მამაკაცის': 'api.menPossessive',
    'მაისური': 'api.tshirt',
    'პერანგი': 'api.jacket',
    'ქურთუკი': 'api.sweatshirt',
    'ჯინსი': 'api.jeans',
    'კაბა': 'api.dress',
    'სპორტული ფეხსაცმელი': 'api.sportShoes',
    'ჰუდი': 'api.hoodie',
    'შავი': 'api.black',
    'თეთრი': 'api.white',
    'ლურჯი': 'api.blue',
    'ნაცრისფერი': 'api.grey',
    'ბეჟი': 'api.beige',
    'მწვანე': 'api.green',
    'წითელი': 'api.red',
    'ზაფხული': 'api.spring',
    'ზამთარი': 'api.winter',
    'დემისეზონური': 'api.allSeason',
    'ყველა სეზონი': 'api.allSeasons',
    'ბამბუკის ბოჭკო': 'api.cotton',
    '40°C მანქანით': 'api.machineWash40',
    'ვიეტნამი': 'api.vietnam',
    '6 თვე': 'api.sixMonths',
    'ტყავი': 'api.leather',
    'პორტუგალია': 'api.portugal',
    'Type': 'api.type',
    'Size': 'api.size',
    'Color': 'api.color',
    'For whom': 'api.forWhom',
    'Season': 'api.season',
    'Material': 'api.material',
    'Washing': 'api.washing',
    'Manufacturer': 'api.manufacturer',
    'Warranty': 'api.warranty',
    'Dress': 'api.dress',
    'Sport shoes': 'api.sportShoes',
    'Hoodie': 'api.hoodie',
    'XS': 'api.xs',
    'S': 'api.s',
    'M': 'api.m',
    'L': 'api.l',
    'XL': 'api.xl',
    'XXL': 'api.xxl',
    '3XL': 'api.xxxl',
    'Red': 'api.red',
    'Blue': 'api.blue',
    'Green': 'api.green',
    'Black': 'api.black',
    'White': 'api.white',
    'Grey': 'api.grey',
    'Beige': 'api.beige',
    "Women's": 'api.womenPossessive',
    "Men's": 'api.menPossessive',
    'Spring': 'api.spring',
    'Winter': 'api.winter',
    'Summer': 'api.spring',
    'Fall': 'api.winter',
    'Cotton': 'api.cotton',
    'Leather': 'api.leather',
    'Vietnam': 'api.vietnam',
    'Portugal': 'api.portugal',
    'China': 'api.china',
    'Turkey': 'api.turkey',
    'India': 'api.india',
    'Bangladesh': 'api.bangladesh',
    'All seasons': 'api.allSeasons',
    'Cotton/Elastane': 'api.cottonElastane',
    '30°C machine wash': 'api.machineWash30',
    '40°C machine wash': 'api.machineWash40',
    '6 months': 'api.sixMonths',
    '12 months': 'api.twelveMonths',
  }

  const key = translations[text]
  if (key) {
    const keys = key.split('.')
    let value: unknown = t
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k]
    }
    if (typeof value === 'string') {
      return value
    }
  }

  return text
}

/**
 * Helper to translate category name
 */
export function translateCategoryName(georgianName: string, t: Translations): string {
  return translateApiData(georgianName, t)
}

/**
 * Helper to translate category description
 */
export function translateCategoryDescription(georgianDesc: string, t: Translations): string {
  return translateApiData(georgianDesc, t)
}

/**
 * Helper to translate filter label
 */
export function translateFilterLabel(georgianLabel: string, t: Translations): string {
  return translateApiData(georgianLabel, t)
}

/**
 * Helper to translate filter option label
 */
export function translateFilterOption(georgianOption: string, t: Translations): string {
  return translateApiData(georgianOption, t)
}

/**
 * Helper to translate spec key
 */
export function translateSpecKey(georgianKey: string, t: Translations): string {
  return translateApiData(georgianKey, t)
}

/**
 * Helper to translate spec value
 */
export function translateSpecValue(georgianValue: string, t: Translations): string {
  return translateApiData(georgianValue, t)
}
