import {
  buildThirdPartyFilters,
  combineFilters,
  isValidDolibarrFilter,
} from "../../utils/dolibarrFilters"

describe("buildThirdPartyFilters", () => {
  it("devrait retourner le filtre correct pour 'customer'", () => {
    expect(buildThirdPartyFilters("customer")).toBe("(client:=:1)")
  })

  it("devrait retourner le filtre correct pour 'supplier'", () => {
    expect(buildThirdPartyFilters("supplier")).toBe("(fournisseur:=:1)")
  })

  it("devrait retourner le filtre correct pour 'both'", () => {
    expect(buildThirdPartyFilters("both")).toBe("(client:in:1,3)")
  })

  it("devrait retourner le filtre correct pour 'all'", () => {
    expect(buildThirdPartyFilters("all")).toBe("(client:in:1,3)")
  })

  it("devrait logger un warning et retourner undefined pour un type invalide", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation()
    // @ts-ignore - Test avec valeur invalide
    const result = buildThirdPartyFilters("invalid")
    expect(result).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe("combineFilters", () => {
  it("devrait combiner deux filtres avec AND", () => {
    const result = combineFilters(["(client:=:1)", "(fournisseur:=:1)"])
    expect(result).toBe("(client:=:1) AND (fournisseur:=:1)")
  })

  it("devrait retourner un seul filtre si un seul est fourni", () => {
    expect(combineFilters(["(client:=:1)"])).toBe("(client:=:1)")
  })

  it("devrait retourner undefined si aucun filtre valide", () => {
    expect(combineFilters([])).toBeUndefined()
    expect(combineFilters([undefined, undefined])).toBeUndefined()
  })

  it("devrait ignorer les filtres undefined", () => {
    const result = combineFilters(["(client:=:1)", undefined, "(fournisseur:=:1)"])
    expect(result).toBe("(client:=:1) AND (fournisseur:=:1)")
  })
})

describe("isValidDolibarrFilter", () => {
  it("devrait valider un filtre simple", () => {
    expect(isValidDolibarrFilter("(client:=:1)")).toBe(true)
  })

  it("devrait valider un filtre avec in", () => {
    expect(isValidDolibarrFilter("(client:in:1,3)")).toBe(true)
  })

  it("devrait valider un filtre avec like", () => {
    expect(isValidDolibarrFilter("(nom:like:'%test%')")).toBe(true)
  })

  it("devrait valider une combinaison avec AND", () => {
    expect(isValidDolibarrFilter("(client:=:1) AND (fournisseur:=:1)")).toBe(true)
  })

  it("devrait rejeter du SQL brut", () => {
    expect(isValidDolibarrFilter("t.client IN (1,3)")).toBe(false)
    expect(isValidDolibarrFilter("SELECT * FROM llx_societe")).toBe(false)
  })

  it("devrait rejeter une string vide", () => {
    expect(isValidDolibarrFilter("")).toBe(false)
  })
})

