import { buildSortParams, isSqlError } from "../../utils/dolibarrSort"

describe("buildSortParams", () => {
  describe("orders", () => {
    it("devrait mapper 'date' vers 'date_commande'", () => {
      const result = buildSortParams("orders", "DESC", "date")
      expect(result.sortfield).toBe("date_commande")
      expect(result.sortorder).toBe("DESC")
    })

    it("devrait utiliser un champ compatible par défaut", () => {
      const result = buildSortParams("orders", "ASC")
      expect(result.sortfield).toBe("date_commande")
      expect(result.sortorder).toBe("ASC")
    })

    it("devrait accepter un champ compatible existant", () => {
      const result = buildSortParams("orders", "DESC", "ref")
      expect(result.sortfield).toBe("ref")
      expect(result.sortorder).toBe("DESC")
    })
  })

  describe("invoices", () => {
    it("devrait mapper 'date' vers 'datef'", () => {
      const result = buildSortParams("invoices", "DESC", "date")
      expect(result.sortfield).toBe("datef")
      expect(result.sortorder).toBe("DESC")
    })

    it("devrait utiliser un champ compatible par défaut", () => {
      const result = buildSortParams("invoices", "ASC")
      expect(result.sortfield).toBe("datef")
      expect(result.sortorder).toBe("ASC")
    })
  })

  describe("products", () => {
    it("devrait utiliser 'ref' par défaut", () => {
      const result = buildSortParams("products", "DESC")
      expect(result.sortfield).toBe("ref")
      expect(result.sortorder).toBe("DESC")
    })
  })

  describe("thirdparties", () => {
    it("devrait utiliser 'nom' par défaut", () => {
      const result = buildSortParams("thirdparties", "ASC")
      expect(result.sortfield).toBe("nom")
      expect(result.sortorder).toBe("ASC")
    })
  })
})

describe("isSqlError", () => {
  it("devrait détecter une erreur 503", () => {
    const error = {
      response: {
        status: 503,
      },
    }
    expect(isSqlError(error)).toBe(true)
  })

  it("devrait détecter une erreur avec 'Unknown column'", () => {
    const error = {
      message: "Unknown column 'date' in 'ORDER BY'",
    }
    expect(isSqlError(error)).toBe(true)
  })

  it("devrait détecter une erreur avec 'column doesn't exist'", () => {
    const error = {
      response: {
        data: {
          error: "Column 'date' doesn't exist",
        },
      },
    }
    expect(isSqlError(error)).toBe(true)
  })

  it("devrait retourner false pour une erreur normale", () => {
    const error = {
      response: {
        status: 404,
        data: {
          error: "Not found",
        },
      },
    }
    expect(isSqlError(error)).toBe(false)
  })

  it("devrait retourner false pour null/undefined", () => {
    expect(isSqlError(null)).toBe(false)
    expect(isSqlError(undefined)).toBe(false)
  })
})

