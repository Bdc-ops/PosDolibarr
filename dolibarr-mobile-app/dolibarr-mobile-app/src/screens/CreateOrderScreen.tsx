import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { useProducts, useThirdParties } from "../hooks/useDolibarr"
import { OrdersAPI } from "../api/orders"
import { DictionariesAPI, type PaymentType, type ShippingMethod } from "../api/dictionaries"
import { ThirdPartiesAPI } from "../api/thirdparties"
import type { Product, OrderLine, ThirdParty } from "../types/dolibarr.types"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { formatPriceWithCurrency } from "../utils/formatPrice"

interface CreateOrderScreenProps {
  navigation: any
  route?: any
}

export default function CreateOrderScreen({ navigation, route }: CreateOrderScreenProps) {
  const { products, loading: productsLoading, reload: reloadProducts } = useProducts(false)
  const { thirdParties, loading: clientsLoading, reload: reloadClients } = useThirdParties("customer")
  
  const [selectedClient, setSelectedClient] = useState<ThirdParty | null>(null)
  const [clientSearch, setClientSearch] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<ThirdParty[]>([])
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [searchProduct, setSearchProduct] = useState("")
  const [orderLines, setOrderLines] = useState<Array<OrderLine & { product?: Product }>>([])
  const [notePublic, setNotePublic] = useState("")
  const [notePrivate, setNotePrivate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("")
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("")
  const [deposit, setDeposit] = useState("")
  const [depositType, setDepositType] = useState<"percent" | "amount">("percent")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    reloadProducts()
    reloadClients()
    loadDictionaries()
  }, [])

  // Recherche client via API (debounce 300ms)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = clientSearch.trim()
      if (q.length < 3) {
        setClientSearchResults([])
        setClientSearchLoading(false)
        return
      }
      setClientSearchLoading(true)
      try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:74',message:'client search start',data:{query:q},timestamp:Date.now(),sessionId:'debug-session',runId:'run-search',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        const results = await ThirdPartiesAPI.search(q)

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:82',message:'client search success',data:{query:q,count:Array.isArray(results)?results.length:0,first:Array.isArray(results)&&results[0]?{id:results[0].id,nom:(results[0] as any).name||(results[0] as any).nom,code:(results[0] as any).code_client}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run-search',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        setClientSearchResults(results)
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:89',message:'client search error',data:{query:q,errorMessage:e instanceof Error?e.message:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run-search',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        setClientSearchResults([])
      } finally {
        setClientSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [clientSearch])

  const loadDictionaries = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:50',message:'START loadDictionaries',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    try {
      const [payments, shipping] = await Promise.all([
        DictionariesAPI.getPaymentTypes(),
        DictionariesAPI.getShippingMethods(),
      ])
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:62',message:'Dictionaries loaded',data:{paymentsCount:payments.length,shippingCount:shipping.length,firstPayment:payments[0],firstShipping:shipping[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      setPaymentTypes(payments)
      setShippingMethods(shipping)
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:72',message:'State updated',data:{paymentsCount:payments.length,shippingCount:shipping.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      // Sélectionner le premier mode par défaut
      if (payments.length > 0) {
        setSelectedPaymentType(payments[0].id)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:81',message:'Default payment selected',data:{selectedId:payments[0].id,selectedLabel:payments[0].label},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      }
      if (shipping.length > 0) {
        setSelectedShippingMethod(shipping[0].id)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:88',message:'Default shipping selected',data:{selectedId:shipping[0].id,selectedLabel:shipping[0].label},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:95',message:'ERROR loadDictionaries',data:{errorMessage:error instanceof Error?error.message:'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      console.error("Erreur lors du chargement des dictionnaires:", error)
    }
  }

  // Écouter le retour de SelectClient pour récupérer le client sélectionné
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Vérifier si un client a été sélectionné via les params de route
      if (route?.params?.selectedClient) {
        setSelectedClient(route.params.selectedClient)
        // Nettoyer les params pour éviter les re-sélections
        navigation.setParams({ selectedClient: undefined })
      }
      // Recharger les clients après retour d'édition
      reloadClients()
    })

    return unsubscribe
  }, [navigation, route, reloadClients])

  const addProductToOrder = (product: Product) => {
    const existingLine = orderLines.find((line) => line.fk_product === product.id)
    
    if (existingLine) {
      // Augmenter la quantité
      const newQty = existingLine.qty + 1
      const subprice = existingLine.subprice
      const tva_tx = existingLine.tva_tx
      const total_ht = newQty * subprice
      const total_tva = total_ht * (tva_tx / 100)
      const total_ttc = total_ht + total_tva
      
      setOrderLines(
        orderLines.map((line) =>
          line.fk_product === product.id
            ? {
                ...line,
                qty: newQty,
                total_ht,
                total_tva,
                total_ttc,
              }
            : line,
        ),
      )
    } else {
      // Nouvelle ligne
      const subprice = Number(product.price) || 0
      const tva_tx = Number(product.tva_tx) || 0
      const qty = 1
      const total_ht = qty * subprice
      const total_tva = total_ht * (tva_tx / 100)
      const total_ttc = total_ht + total_tva
      
      const newLine: OrderLine & { product?: Product } = {
        fk_product: product.id,
        product_ref: product.ref,
        product_label: product.label,
        qty,
        subprice,
        tva_tx,
        total_ht,
        total_tva,
        total_ttc,
        product,
      }
      setOrderLines([...orderLines, newLine])
    }
  }

  const updateLineQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeLine(productId)
      return
    }
    
    setOrderLines(
      orderLines.map((line) => {
        if (line.fk_product === productId) {
          const total_ht = newQty * line.subprice
          const total_tva = total_ht * (line.tva_tx / 100)
          const total_ttc = total_ht + total_tva
          
          return {
            ...line,
            qty: newQty,
            total_ht,
            total_tva,
            total_ttc,
          }
        }
        return line
      }),
    )
  }

  const removeLine = (productId: string) => {
    setOrderLines(orderLines.filter((line) => line.fk_product !== productId))
  }

  const calculateTotals = () => {
    const total_ht = orderLines.reduce((sum, line) => sum + line.total_ht, 0)
    const total_tva = orderLines.reduce((sum, line) => sum + line.total_tva, 0)
    const total_ttc = orderLines.reduce((sum, line) => sum + line.total_ttc, 0)
    return { total_ht, total_tva, total_ttc }
  }

  const handleCreateOrder = async () => {
    if (!selectedClient) {
      Alert.alert("Erreur", "Veuillez sélectionner un client")
      return
    }

    if (orderLines.length === 0) {
      Alert.alert("Erreur", "Veuillez ajouter au moins un produit")
      return
    }

    setCreating(true)
    try {
      const totals = calculateTotals()
      
      // Préparer les données de la commande avec les nouveaux champs
      const order: any = {
        socid: selectedClient.id,
        date: Math.floor(Date.now() / 1000),
        lines: orderLines.map(({ product, ...line }) => line),
        note_public: notePublic,
        note_private: notePrivate,
        total_ht: totals.total_ht,
        total_ttc: totals.total_ttc,
        total_tva: totals.total_tva,
      }

      // Ajouter la date de livraison si renseignée (format timestamp)
      if (deliveryDate) {
        try {
          const deliveryTimestamp = Math.floor(deliveryDate.getTime() / 1000)
          order.date_livraison = deliveryTimestamp
          console.log("📅 Date de livraison ajoutée:", deliveryTimestamp, format(deliveryDate, "dd/MM/yyyy"))
        } catch (e) {
          console.warn("Date de livraison invalide:", deliveryDate)
        }
      }

      // Ajouter le mode de paiement (Dolibarr attend "cond_reglement_id" pour les conditions de règlement)
      if (selectedPaymentType) {
        const paymentId = parseInt(selectedPaymentType, 10)
        // Essayer plusieurs noms de champs selon la version de Dolibarr
        order.mode_reglement_id = paymentId
        ;(order as any).cond_reglement_id = paymentId
        ;(order as any).mode_reglement = paymentId
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:210',message:'Payment mode added',data:{originalValue:selectedPaymentType,convertedValue:paymentId,fieldNames:['mode_reglement_id','cond_reglement_id','mode_reglement']},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E,F'})}).catch(()=>{});
        // #endregion
        console.log("💳 Mode de paiement ajouté:", paymentId)
      }

      // Ajouter le mode d'expédition (Dolibarr attend "shipping_method_id")
      if (selectedShippingMethod) {
        const shippingId = parseInt(selectedShippingMethod, 10)
        order.shipping_method_id = shippingId
        ;(order as any).shipping_method = shippingId
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:225',message:'Shipping mode added',data:{originalValue:selectedShippingMethod,convertedValue:shippingId,fieldNames:['shipping_method_id','shipping_method']},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E,F'})}).catch(()=>{});
        // #endregion
        console.log("🚚 Mode d'expédition ajouté:", shippingId)
      }

      // Ajouter l'acompte
      if (deposit && parseFloat(deposit) > 0) {
        const depositValue = parseFloat(deposit)
        if (depositType === "percent") {
          order.deposit_percent = depositValue
          console.log("💰 Acompte en %:", depositValue)
        } else {
          // Montant fixe
          order.deposit_amount = depositValue
          console.log("💰 Acompte en montant:", depositValue)
        }
      }
      
      console.log("📦 Commande complète à envoyer:", JSON.stringify(order, null, 2))
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:243',message:'Before API call',data:{orderFields:Object.keys(order),hasModeReglement:!!order.mode_reglement_id,hasShippingMethod:!!order.shipping_method_id,modeReglementValue:order.mode_reglement_id,shippingMethodValue:order.shipping_method_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E,F'})}).catch(()=>{});
      // #endregion

      const result = await OrdersAPI.create(order as any)
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:251',message:'After API call',data:{success:result.success,error:result.error},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E,F'})}).catch(()=>{});
      // #endregion
      
      if (result.success) {
        Alert.alert("Succès", "La commande a été créée avec succès", [
          { text: "OK", onPress: () => navigation.goBack() },
        ])
      } else {
        Alert.alert("Erreur", result.error || "Impossible de créer la commande")
      }
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Une erreur est survenue")
    } finally {
      setCreating(false)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.label?.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.ref?.toLowerCase().includes(searchProduct.toLowerCase()),
  )

  const totals = calculateTotals()

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sélection du client */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client (API)..."
            placeholderTextColor="#8A98AD"
            value={clientSearch}
            onChangeText={setClientSearch}
          />
          {clientSearchLoading && <ActivityIndicator style={{ marginVertical: 6 }} color="#0B5FFF" />}
          {clientSearchResults.length > 0 && (
            <FlatList
              data={clientSearchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.clientResultItem}
                  onPress={() => {
                    setSelectedClient(item)
                    setClientSearch("")
                    setClientSearchResults([])
                  }}
                >
                  <View style={styles.clientResultInfo}>
                    <Text style={styles.clientResultName}>{item.name}</Text>
                    <Text style={styles.clientResultMeta}>
                      {item.code_client || ""} {item.town || ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.clientResultList}
              scrollEnabled={false}
            />
          )}

          {selectedClient ? (
            <View style={styles.clientCard}>
              <View style={styles.clientCardContent}>
                <Text style={styles.clientName}>{selectedClient.name}</Text>
                <Text style={styles.clientInfo}>
                  {selectedClient.email || "Pas d'email"}
                </Text>
                {selectedClient.phone && (
                  <Text style={styles.clientInfo}>{selectedClient.phone}</Text>
                )}
                {selectedClient.address && (
                  <Text style={styles.clientInfo}>
                    {selectedClient.address}, {selectedClient.zip} {selectedClient.town}
                  </Text>
                )}
              </View>
              <View style={styles.clientCardActions}>
                <TouchableOpacity
                  style={styles.editClientButton}
                  onPress={() => {
                    navigation.navigate("EditClient", {
                      mode: "edit",
                      client: selectedClient,
                    })
                  }}
                >
                  <Text style={styles.editClientButtonText}>✏️ Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changeClientButton}
                  onPress={() => setSelectedClient(null)}
                >
                  <Text style={styles.changeClientButtonText}>Changer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectClientButton}
              onPress={() => {
                // Utiliser un callback via navigation state au lieu de params
                navigation.navigate("SelectClient")
              }}
            >
              <Text style={styles.selectClientButtonText}>+ Sélectionner un client</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recherche de produits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajouter des produits</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#8A98AD"
            value={searchProduct}
            onChangeText={setSearchProduct}
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productOption}
                onPress={() => addProductToOrder(item)}
              >
                <View style={styles.productOptionInfo}>
                  <Text style={styles.productOptionName}>{item.label}</Text>
                  <Text style={styles.productOptionRef}>{item.ref}</Text>
                </View>
                <Text style={styles.productOptionPrice}>
                  {formatPriceWithCurrency(item.price)}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.productList}
            scrollEnabled={false}
          />
        </View>

        {/* Lignes de commande */}
        {orderLines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produits sélectionnés</Text>
            {orderLines.map((line) => (
              <View key={line.fk_product} style={styles.orderLine}>
                <View style={styles.orderLineInfo}>
                  <Text style={styles.orderLineName}>
                    {line.product_label || "Produit"}
                  </Text>
                  <Text style={styles.orderLineRef}>{line.product_ref}</Text>
                </View>
                <View style={styles.orderLineControls}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateLineQuantity(line.fk_product!, line.qty - 1)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{line.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateLineQuantity(line.fk_product!, line.qty + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.orderLineTotal}>
                    {formatPriceWithCurrency(line.total_ttc)}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeLine(line.fk_product!)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Informations complémentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations complémentaires</Text>
          
          {/* Date de livraison */}
          <Text style={styles.fieldLabel}>Date de livraison souhaitée</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {deliveryDate ? format(deliveryDate, "dd/MM/yyyy", { locale: fr }) : "Sélectionner une date"}
            </Text>
            <Text style={styles.datePickerIcon}>📅</Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={deliveryDate || new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:377',message:'DatePicker onChange',data:{platform:Platform.OS,eventType:event.type,hasDate:!!selectedDate},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C'})}).catch(()=>{});
                // #endregion
                
                // Fermer le picker sur Android immédiatement
                if (Platform.OS === "android") {
                  setShowDatePicker(false)
                }
                
                // Sur iOS, garder ouvert pour permettre la sélection
                if (selectedDate && event.type === "set") {
                  setDeliveryDate(selectedDate)
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/a4dc0171-a6ef-4eb7-9c15-b09c8f9545f1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CreateOrderScreen.tsx:390',message:'Date selected',data:{date:selectedDate.toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C'})}).catch(()=>{});
                  // #endregion
                  
                  // Fermer sur iOS après sélection
                  if (Platform.OS === "ios") {
                    setShowDatePicker(false)
                  }
                }
              }}
              minimumDate={new Date()}
            />
          )}
          
          {deliveryDate && (
            <TouchableOpacity
              style={styles.clearDateButton}
              onPress={() => setDeliveryDate(undefined)}
            >
              <Text style={styles.clearDateButtonText}>Effacer la date</Text>
            </TouchableOpacity>
          )}

          {/* Mode de paiement */}
          <Text style={styles.fieldLabel}>Mode de paiement</Text>
          {paymentTypes.length === 0 && (
            <Text style={styles.loadingText}>Chargement des modes de paiement...</Text>
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsScrollContent}
          >
            {paymentTypes.map((payment) => (
              <TouchableOpacity
                key={payment.id}
                style={[
                  styles.optionBox,
                  selectedPaymentType === payment.id && styles.optionBoxSelected,
                ]}
                onPress={() => {
                  setSelectedPaymentType(payment.id)
                  console.log("💳 Mode de paiement sélectionné:", payment.id, payment.label)
                }}
              >
                <Text
                  style={[
                    styles.optionBoxText,
                    selectedPaymentType === payment.id && styles.optionBoxTextSelected,
                  ]}
                >
                  {payment.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Mode de livraison */}
          <Text style={styles.fieldLabel}>Mode de livraison</Text>
          {shippingMethods.length === 0 && (
            <Text style={styles.loadingText}>Chargement des modes de livraison...</Text>
          )}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsScrollContent}
          >
            {shippingMethods.map((shipping) => (
              <TouchableOpacity
                key={shipping.id}
                style={[
                  styles.optionBox,
                  selectedShippingMethod === shipping.id && styles.optionBoxSelected,
                ]}
                onPress={() => {
                  setSelectedShippingMethod(shipping.id)
                  console.log("🚚 Mode de livraison sélectionné:", shipping.id, shipping.label)
                }}
              >
                <Text
                  style={[
                    styles.optionBoxText,
                    selectedShippingMethod === shipping.id && styles.optionBoxTextSelected,
                  ]}
                >
                  {shipping.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Acompte */}
          <Text style={styles.fieldLabel}>Acompte</Text>
          <View style={styles.depositTypeContainer}>
            <TouchableOpacity
              style={[
                styles.depositTypeButton,
                depositType === "percent" && styles.depositTypeButtonActive,
              ]}
              onPress={() => setDepositType("percent")}
            >
              <Text
                style={[
                  styles.depositTypeButtonText,
                  depositType === "percent" && styles.depositTypeButtonTextActive,
                ]}
              >
                Pourcentage (%)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.depositTypeButton,
                depositType === "amount" && styles.depositTypeButtonActive,
              ]}
              onPress={() => setDepositType("amount")}
            >
              <Text
                style={[
                  styles.depositTypeButtonText,
                  depositType === "amount" && styles.depositTypeButtonTextActive,
                ]}
              >
                Montant (€)
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder={depositType === "percent" ? "Ex: 30" : "Ex: 500.00"}
            placeholderTextColor="#8A98AD"
            value={deposit}
            onChangeText={setDeposit}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          
          <Text style={styles.fieldLabel}>Note publique (visible par le client)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Note visible sur la commande client..."
            placeholderTextColor="#8A98AD"
            value={notePublic}
            onChangeText={setNotePublic}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.fieldLabel}>Note privée (interne uniquement)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Note interne non visible par le client..."
            placeholderTextColor="#8A98AD"
            value={notePrivate}
            onChangeText={setNotePrivate}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Totaux */}
        {orderLines.length > 0 && (
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total HT:</Text>
              <Text style={styles.totalValue}>
                {formatPriceWithCurrency(totals.total_ht)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA:</Text>
              <Text style={styles.totalValue}>
                {formatPriceWithCurrency(totals.total_tva)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total TTC:</Text>
              <Text style={styles.totalValueFinal}>
                {formatPriceWithCurrency(totals.total_ttc)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bouton de création */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!selectedClient || orderLines.length === 0 || creating) &&
              styles.createButtonDisabled,
          ]}
          onPress={handleCreateOrder}
          disabled={!selectedClient || orderLines.length === 0 || creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Créer la commande</Text>
          )}
        </TouchableOpacity>
      </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#EAF0F8",
  },
  backgroundGlow: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(11, 95, 255, 0.15)",
  },
  backgroundGlowSecondary: {
    position: "absolute",
    bottom: -160,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255, 122, 47, 0.12)",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: "#0E1B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E1B2E",
    marginBottom: 12,
  },
  clientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.08)",
  },
  clientCardContent: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
    marginBottom: 4,
  },
  clientInfo: {
    fontSize: 14,
    color: "#5C6B82",
    marginTop: 2,
  },
  clientCardActions: {
    flexDirection: "row",
    gap: 8,
  },
  editClientButton: {
    flex: 1,
    backgroundColor: "#0B5FFF",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  editClientButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  changeClientButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(14, 27, 46, 0.12)",
  },
  changeClientButtonText: {
    color: "#0E1B2E",
    fontSize: 14,
    fontWeight: "600",
  },
  selectClientButton: {
    backgroundColor: "#0B5FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  selectClientButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
  },
  clientResultList: {
    marginBottom: 12,
  },
  clientResultItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 8,
    marginBottom: 6,
  },
  clientResultInfo: {
    flexDirection: "column",
  },
  clientResultName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  clientResultMeta: {
    fontSize: 14,
    color: "#5C6B82",
  },
  productList: {
    maxHeight: 300,
  },
  productOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 16,
    color: "#0E1B2E",
  },
  productOptionRef: {
    fontSize: 14,
    color: "#5C6B82",
    marginTop: 4,
  },
  productOptionPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B5FFF",
  },
  orderLine: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(14, 27, 46, 0.08)",
  },
  orderLineInfo: {
    marginBottom: 8,
  },
  orderLineName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  orderLineRef: {
    fontSize: 14,
    color: "#5C6B82",
    marginTop: 4,
  },
  orderLineControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0B5FFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  qtyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  orderLineTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B5FFF",
    marginLeft: 16,
    minWidth: 80,
    textAlign: "right",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF7A2F",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    color: "#0E1B2E",
  },
  optionsScroll: {
    marginBottom: 8,
    flexGrow: 0,
  },
  optionsScrollContent: {
    paddingRight: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#8A98AD",
    marginBottom: 8,
    fontStyle: "italic",
  },
  optionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderColor: "rgba(14, 27, 46, 0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    minWidth: 120,
    alignItems: "center",
  },
  optionBoxSelected: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  optionBoxText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  optionBoxTextSelected: {
    color: "#fff",
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#0E1B2E",
  },
  datePickerIcon: {
    fontSize: 20,
  },
  clearDateButton: {
    marginTop: 8,
    padding: 8,
    alignItems: "center",
  },
  clearDateButtonText: {
    color: "#FF7A2F",
    fontSize: 14,
    fontWeight: "600",
  },
  depositTypeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  depositTypeButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 2,
    borderColor: "rgba(14, 27, 46, 0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  depositTypeButtonActive: {
    backgroundColor: "#0B5FFF",
    borderColor: "#0B5FFF",
  },
  depositTypeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0E1B2E",
  },
  depositTypeButtonTextActive: {
    color: "#fff",
  },
  totalsSection: {
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: "#0B5FFF",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#5C6B82",
  },
  totalValue: {
    fontSize: 16,
    color: "#0E1B2E",
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0E1B2E",
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0B5FFF",
  },
  footer: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderTopWidth: 1,
    borderTopColor: "rgba(14, 27, 46, 0.08)",
  },
  createButton: {
    backgroundColor: "#0B5FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
})
