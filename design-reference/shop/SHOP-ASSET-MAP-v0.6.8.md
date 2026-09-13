# TonightDefense Shop Asset Map — v0.6.8

## Source sheets

Original generated sheets are preserved outside Cocos runtime resources:

- `design-reference/shop/v0.6.8-source/shop_ui_sheet.png`
- `design-reference/shop/v0.6.8-source/shop_item_icons_sheet.png`
- `design-reference/shop/v0.6.8-source/shop_banner_sheet.png`

Do not move these sheets back under `assets/resources/`; Cocos `resources` content can enter runtime bundles and would waste package size.

## Sliced asset library

All 47 cut PNG assets are preserved in:

- `design-reference/shop/v0.6.8-sliced-library/chrome/`
- `design-reference/shop/v0.6.8-sliced-library/banners/`
- `design-reference/shop/v0.6.8-sliced-library/icons/`
- `design-reference/shop/v0.6.8-sliced-library/item-cards/`

This library is outside `assets/resources`, so unused generated art does not bloat the WeChat runtime bundle.

## Runtime sliced assets

Only assets used by the current ShopPage are copied into `assets/resources/ui/shop/`:

- header / back / currency capsules / price buttons / divider;
- `shop_card_normal.png`;
- featured, stamina, hero-growth, daily-supply, magic-crystal, upgrade-material and skin-coming-soon banners.

Future ShopPage work may promote more sliced assets from `design-reference/shop/v0.6.8-sliced-library/` into runtime resources when they are actually used.

## Runtime loading

`assets/scripts/ui/panels/main-menu/widgets/ShopArt.ts` is the only UI resource loader for ShopPage.

`MainMenuShopPage` must use `ShopArt` keys instead of writing `resources.load()` paths inline.

## UI layout

v0.6.8 implements the chosen Scheme C:

1. fixed full-screen shop header;
2. recommend page: large feature art + stamina side art;
3. horizontal category tabs;
4. two-column product cards;
5. vertical `ScrollView` for short and long phones;
6. cosmetic category uses a disabled coming-soon banner until the hero appearance data system exists.


## v0.6.9 crop correction

The three source sheets are unchanged. v0.6.9 re-crops the same source sheets using their real alpha-connected bounds so neighboring ribbons / gold strips are no longer included in runtime images. The existing `v0.6.8-sliced-library/` path is intentionally retained to avoid duplicating the same source art under a second version directory; its slice contents now represent the corrected cuts used by v0.6.9.

Runtime banners that use proportional `cover` scaling must be children of a fixed-size rectangular Mask viewport. The Sprite's scaled size is intentionally larger than the viewport; the Mask is what prevents it from bleeding into adjacent cards. Full source sheets stay only under `design-reference/` and are never duplicated into `assets/resources/`.

## v0.6.10 category hero and card layering

All five tabs reserve the same category-hero height. Non-recommend tabs use `shop_item_bundle_chest`, `shop_item_upgrade_materials`, `shop_item_skin_comingsoon`, and `shop_item_daily_supply` as distinct transparent hero illustrations, so the hero does not repeat the card banner beneath it.

`shop_card_normal` and `shop_card_disabled` already include the card frame and price-button plate. Runtime code must not draw another card outline or place `shop_price_*` over that plate; it adds only the dynamic currency icon, price text, free text, or sold-out text.
