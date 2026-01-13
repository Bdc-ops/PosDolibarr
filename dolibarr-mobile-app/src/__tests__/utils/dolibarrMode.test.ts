import { mapModeToApi, isValidMode } from "../../utils/dolibarrMode"

describe("mapModeToApi", () => {
  it("devrait mapper 'customer' vers 1", () => {
    expect(mapModeToApi("customer")).toBe(1)
  })

  it("devrait mapper 'supplier' vers 2", () => {
    expect(mapModeToApi("supplier")).toBe(2)
  })

  it("devrait mapper 'both' vers 3", () => {
    expect(mapModeToApi("both")).toBe(3)
  })

  it("devrait mapper 'all' vers 3", () => {
    expect(mapModeToApi("all")).toBe(3)
  })

  it("devrait retourner 1 (défaut) si mode est undefined", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation()
    expect(mapModeToApi(undefined)).toBe(1)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("devrait retourner 1 (défaut) et logger un warning si mode est invalide", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation()
    // @ts-ignore - Test avec valeur invalide
    expect(mapModeToApi("invalid")).toBe(1)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Mode métier inconnu"),
    )
    consoleSpy.mockRestore()
  })
})

describe("isValidMode", () => {
  it("devrait retourner true pour 'customer'", () => {
    expect(isValidMode("customer")).toBe(true)
  })

  it("devrait retourner true pour 'supplier'", () => {
    expect(isValidMode("supplier")).toBe(true)
  })

  it("devrait retourner true pour 'both'", () => {
    expect(isValidMode("both")).toBe(true)
  })

  it("devrait retourner true pour 'all'", () => {
    expect(isValidMode("all")).toBe(true)
  })

  it("devrait retourner false pour une valeur invalide", () => {
    expect(isValidMode("invalid")).toBe(false)
    expect(isValidMode(123)).toBe(false)
    expect(isValidMode(null)).toBe(false)
    expect(isValidMode(undefined)).toBe(false)
  })
})

