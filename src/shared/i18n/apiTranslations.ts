import type { Translations } from './LanguageContext'

/**
 * Translates API response data based on the current language
 * This is a temporary solution until the backend supports Accept-Language header
 */
export function translateApiData(georgianText: string, t: Translations): string {
  // Create a mapping of Georgian text to translation keys
  const translations: Record<string, string> = {
    'ტანსაცმელი და ფეხსაცმელი': 'api.clothingAndFootwear',
    'ყოველდღიური და სპორტული ტანსაცმელი ქალებისა და მამაკაცებისთვის.': 'api.clothingAndFootwearDesc',
    // Filter labels
    'ვისთვის': 'api.forWhom',
    'ფერი': 'api.color',
    'ზომა': 'api.size',
    'ბრენდი': 'api.brand',
    'ფასი': 'api.price',
    'ტიპი': 'api.type',
    'სეზონი': 'api.season',
    // Spec keys
    'მასალა': 'api.material',
    'რეცხვა': 'api.washing',
    'წარმოება': 'api.manufacturer',
    // Filter options - For whom
    'ქალბატონები': 'api.women',
    'მამაკაცები': 'api.men',
    'უნისექსი': 'api.unisex',
    'ბავშვები': 'api.kids',
    'ქალის': 'api.womenPossessive',
    'მამაკაცის': 'api.menPossessive',
    // Filter options - Type
    'მაისური': 'api.tshirt',
    'პერანგი': 'api.jacket',
    'ქურთუკი': 'api.sweatshirt',
    'ჯინსი': 'api.jeans',
    'კაბა': 'api.dress',
    'სპორტული ფეხსაცმელი': 'api.sportShoes',
    'ჰუდი': 'api.hoodie',
    // Filter options - Color
    'შავი': 'api.black',
    'თეთრი': 'api.white',
    'ლურჯი': 'api.blue',
    'ნაცრისფერი': 'api.grey',
    'ბეჟი': 'api.beige',
    'მწვანე': 'api.green',
    'წითელი': 'api.red',
    // Filter options - Season
    'ზაფხული': 'api.spring',
    'ზამთარი': 'api.winter',
    'დემისეზონური': 'api.allSeason',
    'ყველა სეზონი': 'api.allSeasons',
    // Spec values
    'ბამბუკის ბოჭკო': 'api.cotton',
    '40°C მანქანით': 'api.machineWash40',
    'ვიეტნამი': 'api.vietnam',
  }

  const key = translations[georgianText]
  if (key) {
    // Access nested property using key path (e.g., 'api.clothingAndFootwear')
    const keys = key.split('.')
    let value: unknown = t
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k]
    }
    if (typeof value === 'string') {
      return value
    }
  }

  // Return original text if no translation found
  return georgianText
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
