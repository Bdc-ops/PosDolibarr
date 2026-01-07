import { normalizeApiUrl } from "../../utils/normalizeApiUrl"

describe("normalizeApiUrl", () => {
  it("devrait ajouter /api/index.php si absent", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait gérer les URLs avec trailing slash", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com/")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait ne pas modifier l'URL si /api/index.php est déjà présent", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com/api/index.php")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait nettoyer les slashes en double", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com//api//index.php")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait gérer les URLs avec chemin partiel", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com/subfolder")).toBe(
      "https://dolibarr.example.com/subfolder/api/index.php",
    )
  })

  it("devrait gérer les URLs avec chemin partiel et trailing slash", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com/subfolder/")).toBe(
      "https://dolibarr.example.com/subfolder/api/index.php",
    )
  })

  it("devrait gérer les URLs HTTP", () => {
    expect(normalizeApiUrl("http://dolibarr.example.com")).toBe(
      "http://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait gérer les URLs avec port", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com:8080")).toBe(
      "https://dolibarr.example.com:8080/api/index.php",
    )
  })

  it("devrait gérer les valeurs null/undefined/vides", () => {
    expect(normalizeApiUrl("")).toBe("")
    expect(normalizeApiUrl(null as any)).toBe(null)
    expect(normalizeApiUrl(undefined as any)).toBe(undefined)
  })

  it("devrait gérer les URLs avec /api/index.php en minuscules", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com/API/INDEX.PHP")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait nettoyer les espaces", () => {
    expect(normalizeApiUrl("  https://dolibarr.example.com  ")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })

  it("devrait gérer les URLs avec plusieurs slashes", () => {
    expect(normalizeApiUrl("https://dolibarr.example.com///api///index.php")).toBe(
      "https://dolibarr.example.com/api/index.php",
    )
  })
})

