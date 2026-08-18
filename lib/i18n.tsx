'use client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'fr' | 'en'

type Dictionary = Record<string, string>

const fr: Dictionary = {
  nav_home: 'Accueil',
  nav_shop: 'Catalogue',
  nav_promos: 'Promos',
  nav_referral: 'Parrainage',
  nav_orders: 'Mes commandes',
  nav_wishlist: 'Favoris',
  nav_admin: 'Administration',
  nav_login: 'Connexion',
  nav_register: 'Créer un compte',
  nav_logout: 'Déconnexion',
  nav_account: 'Mon compte',
  hero_shop_now: 'Découvrir',
  featured: 'Produits en vedette',
  all_products: 'Toute la boutique',
  categories: 'Nos catégories',
  view_all: 'Voir tout',
  newsletter_title: 'Restez informé',
  newsletter_sub: 'Recevez nos nouveautés et promotions.',
  newsletter_placeholder: 'Votre e-mail',
  newsletter_cta: "S'inscrire",
  search_placeholder: 'Rechercher un produit…',
  filter: 'Filtres',
  sort: 'Trier',
  sort_newest: 'Nouveautés',
  sort_price_asc: 'Prix croissant',
  sort_price_desc: 'Prix décroissant',
  category_all: 'Toutes les catégories',
  out_of_stock: 'Rupture de stock',
  in_stock: 'En stock',
  add_to_cart: 'Ajouter au panier',
  add_to_wishlist: 'Ajouter aux favoris',
  removed_from_wishlist: 'Retirer des favoris',
  reviews: 'Avis',
  no_reviews: 'Aucun avis pour le moment. Soyez le premier !',
  write_review: 'Laisser un avis',
  your_rating: 'Votre note',
  your_comment: 'Votre commentaire',
  submit_review: 'Envoyer l\'avis',
  login_required_review: 'Connectez-vous pour laisser un avis.',
  description: 'Description',
  quantity: 'Quantité',
  cart_title: 'Mon panier',
  cart_empty: 'Votre panier est vide.',
  cart_total: 'Total',
  checkout: 'Commander',
  continue_shopping: 'Continuer mes achats',
  checkout_name: 'Nom complet',
  checkout_phone: 'Téléphone (WhatsApp)',
  checkout_submit: 'Valider et envoyer sur WhatsApp',
  checkout_note: 'Votre commande sera envoyée à notre équipe par WhatsApp pour confirmation.',
  order_placed: 'Commande envoyée !',
  order_kindly: 'Cliquez pour finaliser sur WhatsApp',
  order_track: 'Suivre ma commande',
  order_track_number: 'Numéro de commande',
  order_status_pending: 'En attente',
  order_status_validated: 'Validée',
  order_status_cancelled: 'Annulée',
  my_orders: 'Mes commandes',
  no_orders: 'Aucune commande pour le moment.',
  login_title: 'Connexion',
  login_sub: 'Accédez à votre compte',
  login_email: 'Adresse e-mail',
  login_password: 'Mot de passe',
  login_submit: 'Se connecter',
  login_switch: 'Pas de compte ? Créer un compte',
  register_title: 'Créer un compte',
  register_sub: 'Rejoignez notre boutique',
  register_name: 'Nom complet',
  register_submit: 'Créer mon compte',
  register_switch: 'Déjà un compte ? Se connecter',
  welcome_guest: 'Invité',
  wishlist_title: 'Mes favoris',
  wishlist_empty: 'Votre liste de favoris est vide.',
  contact_title: 'Nous contacter',
  contact_subject: 'Sujet',
  contact_message: 'Message',
  contact_submit: 'Envoyer',
  footer_rights: 'Tous droits réservés.',
  stock_label: 'Stock',
  related: 'Produits similaires',
  guest_checkout: 'Commander en tant qu’invité',
  login_to_track: 'Connectez-vous pour suivre vos commandes.',
  promo: 'Promotion',
  price: 'Prix',
  delete: 'Supprimer',
  edit: 'Modifier',
}

const en: Dictionary = {
  nav_home: 'Home',
  nav_shop: 'Shop',
  nav_promos: 'Promos',
  nav_referral: 'Refer a friend',
  nav_orders: 'My orders',
  nav_wishlist: 'Wishlist',
  nav_admin: 'Admin',
  nav_login: 'Log in',
  nav_register: 'Create account',
  nav_logout: 'Log out',
  nav_account: 'My account',
  hero_shop_now: 'Discover',
  featured: 'Featured products',
  all_products: 'All products',
  categories: 'Our categories',
  view_all: 'View all',
  newsletter_title: 'Stay in the loop',
  newsletter_sub: 'Get our new arrivals and promotions.',
  newsletter_placeholder: 'Your email',
  newsletter_cta: 'Subscribe',
  search_placeholder: 'Search a product…',
  filter: 'Filters',
  sort: 'Sort',
  sort_newest: 'Newest',
  sort_price_asc: 'Price: low to high',
  sort_price_desc: 'Price: high to low',
  category_all: 'All categories',
  out_of_stock: 'Out of stock',
  in_stock: 'In stock',
  add_to_cart: 'Add to cart',
  add_to_wishlist: 'Add to wishlist',
  removed_from_wishlist: 'Remove from wishlist',
  reviews: 'Reviews',
  no_reviews: 'No reviews yet. Be the first!',
  write_review: 'Leave a review',
  your_rating: 'Your rating',
  your_comment: 'Your comment',
  submit_review: 'Submit review',
  login_required_review: 'Log in to leave a review.',
  description: 'Description',
  quantity: 'Quantity',
  cart_title: 'My cart',
  cart_empty: 'Your cart is empty.',
  cart_total: 'Total',
  checkout: 'Checkout',
  continue_shopping: 'Continue shopping',
  checkout_name: 'Full name',
  checkout_phone: 'Phone (WhatsApp)',
  checkout_submit: 'Validate & send on WhatsApp',
  checkout_note: 'Your order will be sent to our team via WhatsApp for confirmation.',
  order_placed: 'Order sent!',
  order_kindly: 'Click to finalize on WhatsApp',
  order_track: 'Track my order',
  order_track_number: 'Order number',
  order_status_pending: 'Pending',
  order_status_validated: 'Validated',
  order_status_cancelled: 'Cancelled',
  my_orders: 'My orders',
  no_orders: 'No orders yet.',
  login_title: 'Log in',
  login_sub: 'Access your account',
  login_email: 'Email address',
  login_password: 'Password',
  login_submit: 'Log in',
  login_switch: 'No account? Create one',
  register_title: 'Create account',
  register_sub: 'Join our shop',
  register_name: 'Full name',
  register_submit: 'Create my account',
  register_switch: 'Already have an account? Log in',
  welcome_guest: 'Guest',
  wishlist_title: 'My wishlist',
  wishlist_empty: 'Your wishlist is empty.',
  contact_title: 'Contact us',
  contact_subject: 'Subject',
  contact_message: 'Message',
  contact_submit: 'Send',
  footer_rights: 'All rights reserved.',
  stock_label: 'Stock',
  related: 'Related products',
  guest_checkout: 'Order as guest',
  login_to_track: 'Log in to track your orders.',
  promo: 'Promo',
  price: 'Price',
  delete: 'Delete',
  edit: 'Edit',
}

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = (localStorage.getItem('tec221_locale') as Locale | null) ?? 'fr'
    setLocaleState(saved)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem('tec221_locale', next)
  }, [])

  const dict = locale === 'en' ? en : fr

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => dict[key] ?? key,
    }),
    [locale, setLocale, dict]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function pickLocal(
  locale: Locale,
  frValue?: string | null,
  enValue?: string | null
): string {
  if (locale === 'en' && enValue) return enValue
  return frValue ?? enValue ?? ''
}
