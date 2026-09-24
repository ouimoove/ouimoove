import { useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

// Cart/checkout/resale-purchase orchestration — shared by CartModal,
// CheckoutModal, EventDetailModal, ResaleMarketModal, and two of App.jsx's
// own effects (the PayDunya return handler and the justPaidOrder realtime
// listener), all of which need to "open a checkout URL" or "celebrate an
// order" the same way. Kept together rather than split further since every
// caller needs more than one of these functions and they share the
// celebratedOrders dedupe ref.
export function useCheckoutFlow(store, toast, { open, close }) {
  // Dedupe so a purchase completed via both the return-flow and the
  // realtime "just paid" event doesn't celebrate twice for the same order.
  const celebratedOrders = useRef(new Set())

  const celebrateOrder = (orderId, message = '🎉 Paiement confirmé ! Vos billets sont disponibles.') => {
    if (!orderId || celebratedOrders.current.has(orderId)) return
    celebratedOrders.current.add(orderId)
    // In the native app the PayDunya checkout is an in-app browser sheet on
    // top of the webview — dismiss it so the celebration is visible.
    if (Capacitor.isNativePlatform()) Browser.close().catch(() => {})
    toast(message, 'success')
    open('tickets')
  }

  // On the web, checkout navigates the tab to PayDunya and the return URL
  // brings the user back. Inside the Capacitor shell, navigating the webview
  // away would leave the app entirely — so open checkout in the in-app
  // browser instead and let the paydunya-webhook + justPaidOrder realtime
  // listener complete and celebrate the order (no return redirect needed).
  const openCheckout = async (url) => {
    if (Capacitor.isNativePlatform()) await Browser.open({ url })
    else window.location.href = url
  }

  const handleAddToCart = (event, selections) => {
    const result = store.addToCart(event, selections)
    if (!result) { toast('Sélectionnez au moins 1 billet', 'error'); return }
    if (result.error) { toast(result.error, 'error'); return }
    toast('Billets ajoutés au panier !', 'success')
    close()
  }

  const handlePurchase = async (method, phone, discountAmount = 0, promoCode = '') => {
    const result = await store.purchase(method, phone, discountAmount, promoCode)
    if (!result) { toast('Paiement impossible. Réessayez.', 'error'); return }
    if (result.error) { toast(result.error, 'error'); return }
    if (result.pdError) { toast(`Erreur de paiement SèviGo : ${result.pdError}`, 'error'); return }
    if (result.redirect) {
      await openCheckout(result.redirect)
      return
    }
    close()
    celebrateOrder(result.orderId)
  }

  const handleBuyResale = async (listing, method, phone) => {
    const result = await store.buyResaleListing(listing, method, phone)
    if (!result) { toast('Achat impossible. Réessayez.', 'error'); return result }
    if (result.error) { toast(result.error, 'error'); return result }
    if (result.redirect) { await openCheckout(result.redirect); return result }
    celebrateOrder(result.orderId, '🎉 Billet acheté ! Disponible dans Mes Billets.')
    return result
  }

  return { celebrateOrder, openCheckout, handleAddToCart, handlePurchase, handleBuyResale }
}
