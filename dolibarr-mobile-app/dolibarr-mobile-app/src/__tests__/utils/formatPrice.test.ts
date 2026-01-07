import { formatPrice, formatPriceWithCurrency } from "../../utils/formatPrice"

describe("formatPrice", () => {
  describe("formatPrice", () => {
    it("devrait formater un nombre correctement", () => {
      expect(formatPrice(10.5)).toBe("10.50")
      expect(formatPrice(100)).toBe("100.00")
      expect(formatPrice(0)).toBe("0.00")
    })

    it("devrait formater une chaîne de caractères", () => {
      expect(formatPrice("10.5")).toBe("10.50")
      expect(formatPrice("100")).toBe("100.00")
      expect(formatPrice("0")).toBe("0.00")
    })

    it("devrait gérer null et undefined", () => {
      expect(formatPrice(null)).toBe("0.00")
      expect(formatPrice(undefined)).toBe("0.00")
    })

    it("devrait gérer les valeurs invalides", () => {
      expect(formatPrice("invalid")).toBe("0.00")
      expect(formatPrice("")).toBe("0.00")
      expect(formatPrice(NaN)).toBe("0.00")
    })

    it("devrait respecter le nombre de décimales", () => {
      expect(formatPrice(10.5, 0)).toBe("11")
      expect(formatPrice(10.5, 1)).toBe("10.5")
      expect(formatPrice(10.5, 3)).toBe("10.500")
    })
  })

  describe("formatPriceWithCurrency", () => {
    it("devrait formater avec le symbole €", () => {
      expect(formatPriceWithCurrency(10.5)).toBe("10.50 €")
      expect(formatPriceWithCurrency(100)).toBe("100.00 €")
    })

    it("devrait gérer null et undefined", () => {
      expect(formatPriceWithCurrency(null)).toBe("0.00 €")
      expect(formatPriceWithCurrency(undefined)).toBe("0.00 €")
    })

    it("devrait gérer les valeurs invalides", () => {
      expect(formatPriceWithCurrency("invalid")).toBe("0.00 €")
      expect(formatPriceWithCurrency(NaN)).toBe("0.00 €")
    })
  })
})

