# A10 Hairsalon 正式仕様書

- 対象リポジトリ: `a10-hairsalon-v2`（A10 Hairsalon）
- 作成日: 2026-09-23
- 位置づけ: A10 Hairsalon の正式な仕様書。旧プロジェクト（廃止予定）の仕様のうち、A10 に引き継ぐものもこの文書に統合する。旧プロジェクトの資料は参照しない前提で読めるようにしている。

## 0. この文書の読み方

各仕様には現在の実装状況を付けている（2026-09-23 時点、`main` の `fe3449e` で確認）。

| 記号 | 意味 |
|---|---|
| ✅ 実装済み | API と画面の両方で動く |
| 🟡 一部 | DB・API・画面のどれかが欠けている、またはモックのまま |
| ❌ 未実装 | A10 に存在しない |
| 🔁 旧版から引き継ぎ | 旧プロジェクトにあり、A10 では未実装の仕様。A10 の要件として採用する |

---

## 1. 概要

スタッフ 2〜5 人程度の美容室で使う、自店舗用の予約・電子カルテ管理システム。

### 1.1 アプリ構成

| アプリ | 利用者 | 役割 | 本番URL（予定ドメイン） |
|---|---|---|---|
| Salon App (`apps/salon`) | 店長・管理者 | 全スタイリストの予約表、顧客、設定、売上 | admin.goodhairdesign.com |
| Stylist App (`apps/stylist`) | スタイリスト | 自分の予約（日/週/月）、カルテ入力 | stylist.goodhairdesign.com |
| Customer App (`apps/customer`) | お客様 | 予約、来店履歴、メッセージ | app.goodhairdesign.com |
| API (`apps/api`) | 各アプリ | Cloudflare Workers + D1 (SQLite) | — |
| 共有 (`packages/shared`) | 各アプリ | 型定義・ユーティリティ | — |

### 1.2 技術スタック

- フロントエンド: Vite + React + TypeScript（各アプリを独立した Vercel プロジェクトとしてデプロイ）
- バックエンド: Cloudflare Workers + D1
- UI 方針: LiME 風のデザインで 3 アプリを統一する

---

## 2. 予約管理

### 2.1 予約表の表示

| 仕様 | 状況 |
|---|---|
| 日・週・月の表示をすぐ切り替えられる | 🟡 Stylist App は日/週/月あり。Salon App は日表示中心（`viewPeriod` 切替の UI は一部） |
| 自分だけ / 全スタイリスト の表示切替（Stylist App） | ✅ |
| スタイリスト列 × 時間のグリッドで予約を表示（Salon App） | ✅ |
| ドラッグ＆ドロップで予約の担当者・開始時刻を変更 | 🟡 UI はあるが、API 呼び出し先が誤っている（§9 既知の不具合 B-2） |
| 下端ドラッグで終了時刻を変更 | 🟡 UI のみ |
| 縦表示 / 横表示の切り替え | 🔁 旧版から引き継ぎ（❌） |
| 現在時刻ライン | ✅ |

### 2.2 予約の作成・変更・取消

| 仕様 | 状況 |
|---|---|
| 予約の作成（Salon / Stylist / Customer / LINE から） | ❌ `POST /api/appointments` が無い。Customer App の「予約を確定する」は確認ダイアログを出すだけで保存しない |
| 予約の変更（担当者・日時） | 🟡 `PUT /api/appointments/:id` はあるが `end_time` を更新しない |
| 予約の取消 | ❌ API・画面とも無い |
| 予約ステータス: `pending` / `confirmed` / `completed` / `cancelled` | 🟡 DB 列のみ |
| 予約一覧の CSV エクスポート | 🔁 旧版から引き継ぎ（❌） |

### 2.3 日ごとの予約受付上限・同時受付人数（重要）

旧プロジェクトの要件「日によって予約可能人数を変更できる」を A10 の正式要件とする。旧版にも実装はなく（スタイリスト単位の固定値のみ）、A10 でも **未実装**。

**要件**

1. **日ごとの予約受付上限**: 日付ごとに、その日に受け付ける予約件数の上限を設定できる。
   - 既定値は曜日ごとに設定し、特定の日付だけ上書きできる。
   - 上限に達した日は、Customer App と LINE から予約できない（Salon App からは警告のうえ登録可能にするかは要確認）。
2. **日ごとの同時受付人数**: 同じ時間帯に同時に施術できる人数の上限を、日付ごとに設定できる。
   - 例: 通常は 3 人、スタッフが少ない日は 2 人。
   - スタイリスト単位の同時受付数（旧版の `max_concurrent_bookings`）も持つ。店全体の上限とスタイリストの上限の両方を満たす必要がある。
3. **その他の予約ルール**（旧版から引き継ぎ、スタイリストごとに設定）
   - 何日先まで予約を受け付けるか（旧版の既定: 90 日）
   - 当日予約を許可するか（既定: 許可）
   - 同じ開始時刻の重複を許可するか（既定: 不許可）
   - 営業時間外の予約を許可するか（既定: 不許可）

**データ設計案**（未実装）

```sql
-- 曜日ごとの既定値
CREATE TABLE capacity_rules (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,        -- 0-6
  max_bookings_per_day INTEGER,        -- NULL = 上限なし
  max_concurrent INTEGER NOT NULL,     -- 同時受付人数
  UNIQUE(salon_id, day_of_week)
);
-- 特定日の上書き
CREATE TABLE capacity_overrides (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  date TEXT NOT NULL,                  -- YYYY-MM-DD
  max_bookings_per_day INTEGER,
  max_concurrent INTEGER,
  note TEXT,
  UNIQUE(salon_id, date)
);
-- スタイリストごとの予約ルール
CREATE TABLE booking_rules (
  id TEXT PRIMARY KEY,
  stylist_id TEXT NOT NULL UNIQUE,
  max_days_advance INTEGER NOT NULL DEFAULT 90,
  allow_same_day INTEGER NOT NULL DEFAULT 1,
  max_concurrent_bookings INTEGER NOT NULL DEFAULT 1,
  allow_overlapping_start INTEGER NOT NULL DEFAULT 0,
  allow_off_hours_booking INTEGER NOT NULL DEFAULT 0
);
```

### 2.4 予約時の上限・重複チェック（重要）

予約の作成・変更時に、**サーバー側（API）で**以下を検査し、違反時は `409 Conflict` と理由を返す。画面側の空き表示だけに頼らない。

| チェック | 状況 |
|---|---|
| 同じスタイリストの時間帯の重複（`start < 既存end && end > 既存start`、`cancelled` は除外） | 🟡 空き枠の**表示**（`GET /api/availability`）では除外しているが、作成・変更時の検査は無い |
| 休み（`off_days`）・勤務時間（`working_hours`）外 | 🟡 表示のみ |
| プライベートタイム（`private_time`）との重複 | ❌ 空き枠計算でも考慮していない |
| 日ごとの予約受付上限 | ❌ |
| 日ごとの同時受付人数（店全体・スタイリスト単位） | ❌ |
| 何日先まで・当日可否・同時刻開始の可否 | ❌ |
| 同時に 2 件の予約が来たときの二重登録防止（D1 のバッチ/トランザクションで検査と挿入を一体化） | ❌ |

### 2.5 空き枠の計算

- ✅ `GET /api/availability?date=&menu_id=`: 有効なスタイリストごとに、休み・勤務時間・既存予約（`confirmed`）を考慮し、30 分刻みで空き開始時刻を返す。
- 今後: プライベートタイム、日ごとの上限・同時受付人数、予約ルールも反映する。

### 2.6 メニュー

| 仕様 | 状況 |
|---|---|
| メニュー（名前・所要時間・料金・色・説明・表示順） | ✅ |
| メニューセット（複数メニューの組み合わせ、合計料金・時間） | ✅ |
| スタイリストごとのメニュー・料金 | 🔁 旧版から引き継ぎ（❌）。店共通メニューで足りるかは要確認 |

### 2.7 勤務時間・休み・プライベートタイム

| 仕様 | 状況 |
|---|---|
| スタイリストごとの曜日別勤務時間 | ✅ |
| スタイリストごとの休日（日付指定） | ✅ |
| 店の休業日（全員共通） | 🔁 旧版から引き継ぎ（❌）。旧版は休日に `salon` / `personal` の種別があった |
| プライベートタイム（休憩・研修など） | ✅ API あり |
| プライベートタイムの公開範囲（非公開 / 店に共有、タイトルを店に見せるか、色、メモ） | 🔁 旧版から引き継ぎ（❌） |

---

## 3. 顧客カルテ

### 3.1 顧客情報

| 仕様 | 状況 |
|---|---|
| 顧客（氏名・電話・メール・メモ）、電話番号は店内で一意 | 🟡 DB のみ。顧客 API・顧客管理画面は「準備中」 |
| 顧客の検索・一覧・詳細 | ❌ |

### 3.2 カルテ（施術記録）

カルテは「来店 1 回 = 1 件」とし、予約に紐づける。

| 項目 | 内容 | 状況 |
|---|---|---|
| 施術内容 | 実施したメニュー、カット・カラー・パーマ等の内容 | 🟡 `charts` に専用列なし。`shared_notes` に自由記述する想定のみ |
| 会話メモ | お客様との会話・好み・次回の話題（スタッフのみ閲覧） | 🟡 `private_notes` 列のみ。画面なし |
| お客様への共有メモ | 施術内容・アドバイスをお客様に共有 | 🟡 `shared_notes` 列のみ |
| 薬剤配合 | 薬剤名・メーカー・色番・配合比・オキシ濃度・放置時間・塗布部位 | ❌ 旧版にも無い新規要件 |
| アレルギー・注意事項 | 顧客単位で保持し、予約表・カルテ画面で常に目立つ表示にする | ❌ 旧版にも無い新規要件（旧版は予約画面の案内文のみ） |
| 施術前後写真 | 1 カルテに複数枚、前/後の区分、表示順、キャプション | 🟡 `chart_photos` テーブルのみ。前/後の区分列なし、アップロード API・保存先なし |
| カルテ画面（Stylist App） | 「カルテ」タブは「準備中」表示 | ❌ |
| カルテのお客様への共有（写真・共有メモを Customer App / LINE で見せる） | 🔁 旧版から引き継ぎ（❌） | |

**データ設計案**（未実装）

```sql
ALTER TABLE customers ADD COLUMN allergy_notes TEXT;     -- アレルギー
ALTER TABLE customers ADD COLUMN caution_notes TEXT;     -- 注意事項（頭皮・既往・NG事項など）
ALTER TABLE charts ADD COLUMN treatment_details TEXT;    -- 施術内容
-- private_notes を「会話メモ」、shared_notes を「お客様への共有メモ」として使う
ALTER TABLE chart_photos ADD COLUMN kind TEXT;           -- 'before' | 'after' | 'other'

CREATE TABLE chart_formulas (          -- 薬剤配合（1 カルテに複数）
  id TEXT PRIMARY KEY,
  chart_id TEXT NOT NULL,
  category TEXT,                       -- カラー / パーマ / 縮毛矯正 / トリートメント
  area TEXT,                           -- 根元 / 毛先 など
  product TEXT NOT NULL,               -- 薬剤名・メーカー・色番
  ratio TEXT,                          -- 配合比（例: 6N:8B = 2:1）
  developer TEXT,                      -- オキシ濃度（例: 6%）
  processing_minutes INTEGER,          -- 放置時間
  memo TEXT,
  display_order INTEGER,
  FOREIGN KEY (chart_id) REFERENCES charts(id)
);
```

### 3.3 来店履歴・売上

| 仕様 | 状況 |
|---|---|
| 顧客ごとの来店履歴（日時・担当・メニュー） | 🟡 Customer App の履歴画面はモックデータ |
| 会計（実際の請求額・値引き・支払方法・物販）の記録 | ❌ 旧版にも無い新規要件 |
| 売上集計（日/月、スタイリスト別、メニュー別） | ❌ 旧版にも無い（旧版は構想のみ） |

売上は予約のメニュー料金ではなく、**会計時の確定額**を正とする（値引き・追加メニュー・物販があるため）。会計テーブルを新設する（設計は要確認）。

---

## 4. LINE 連携

| 仕様 | 状況 |
|---|---|
| 友だち追加時のあいさつと LINE ユーザーの登録（`line_users`） | ✅ |
| 「予約」と送るとメニュー → スタイリスト → 日時の順に選ぶ予約フロー（`booking_sessions`） | 🟡 日時入力以降（空き確認・予約確定）が未実装 |
| Webhook の署名検証（`x-line-signature`） | ❌ 必須。現在は検証していない |
| 返信 API の URL | ❌ 不具合: `api.line.biz` になっている（正しくは `api.line.me`） |
| LINE ユーザーと顧客の紐づけ | 🟡 列のみ |
| 予約確定・変更・取消の通知、前日リマインダー | ❌ |
| 空き枠のお知らせ・セグメント配信 | 🔁 旧版から引き継ぎ（❌） |
| お客様とスタイリストのメッセージ（スレッド・既読・画像） | 🔁 旧版から引き継ぎ（❌）。A10 の `messages` テーブルはスレッド無しの単純な形 |
| カルテの LINE 共有 | 🔁 旧版から引き継ぎ（❌） |

**方針**

- 通知はすべて **Messaging API（push / reply）** で行う。旧版で使っていた LINE Notify はサービス終了済みのため採用しない。
- チャネルシークレット・アクセストークンは `wrangler secret` で登録し、リポジトリに書かない（§8）。

---

## 5. 認証・スタッフ権限

| 仕様 | 状況 |
|---|---|
| スタッフのログイン（スタッフ選択 + 6桁PIN） | 🟡 API・Salon App・Stylist App のログイン画面を実装（ローカルで確認済み、本番未反映） |
| スタッフ権限（役割 + 個別権限） | 🟡 API で全権限を検証。カルテ編集・顧客削除・CSV は機能自体が未実装のため、権限の定義と設定画面のみ |
| お客様の電話番号 + ワンタイムコードでのログイン | ❌ 開発メモでは完了扱いだが、リポジトリに該当コード（`/api/auth/phone`, `/api/auth/verify`, `0004_auth_system.sql`）が存在しない（未 push の可能性） |

**スタッフ登録**

- 必須は名前のみ。メールアドレス・電話番号は任意のプロフィール情報（空欄は NULL で保存）。
- `accepts_bookings`（予約を受ける）: ON のスタッフだけを LINE の指名候補・予約表・空き時間計算に出す（条件: `is_active = 1 AND accepts_bookings = 1`）。受付・アシスタントは OFF。
- 削除は論理削除（`is_active = 0`）。予約・カルテなどの関連データは残す。

**ログイン**（Salon App / Stylist App 共通の認証基盤。`packages/shared/src/auth`）

- 「スタッフを選択 → 6桁の数字のPINを入力」。同じ数字の繰り返し・連番（123456 など）は不可。
- PIN は平文保存しない。PBKDF2-SHA256 + スタッフごとの salt + Workers Secret `PIN_PEPPER` の HMAC でハッシュ化（`apps/api/src/auth/pin.ts`）。
- 5回連続で失敗すると15分ロック。
- セッション: ランダムなトークンを発行し、DB には SHA-256 ハッシュのみ保存（`staff_sessions`）。最後の操作から12時間有効。ブラウザでは sessionStorage に置き、タブを閉じると再ログイン。PIN変更・無効化・役割変更でそのスタッフのセッションを無効化。
- 最初の owner は `apps/api/scripts/setup-owner.ts` で設定する（本人がターミナルで実行し、PIN は画面に表示しない入力でのみ受け取る）。

**役割**

| 役割 | 内容 |
|---|---|
| `owner` | 全権限。admin の任命・変更ができる。最後の owner は削除・無効化・降格できない |
| `admin` | 全権限を持つ管理者。staff / stylist の役割・権限・PIN を変更できる。owner / admin の任命・変更はできない |
| `staff` | 受付・アシスタント等。個別に付与された権限のみ |
| `stylist` | 施術・予約を担当。個別に付与された権限のみ |

**個別権限**（staff / stylist に owner・admin が ON/OFF する。既定はすべて OFF）

| 権限キー | 内容 |
|---|---|
| `add_remove_staff` | スタッフの追加・削除（無効化）・プロフィール編集 |
| `change_settings` | サロン情報・メニュー・営業時間・休日・予約ルールなど店舗全体の設定 |
| `edit_records` | カルテの編集 |
| `delete_customers` | 顧客の削除 |
| `export_csv` | CSV エクスポート |

- 権限の一覧・変更は owner / admin のみ。権限はリクエストごとに DB から読むため、変更は即時に反映される。
- 権限の検証はすべて API 側で行う（`apps/api/src/auth/policy.ts` に API ごとの条件。記載の無い API はログイン必須）。画面での非表示は補助。
- ログイン不要のまま維持する API: `GET /api/stylists`（公開用の id・名前・紹介・画像のみ）、`GET /api/menus`、`GET /api/menu-sets`、`GET /api/availability`、`GET /api/salon/settings`、LINE Webhook（LINE の署名で検証）。
- 公開 API から `pin_hash`・権限・セッション・ロック状態などの認証関連情報は返さない。
- 追加で検討: 会話メモ・アレルギー情報など個人情報の閲覧範囲、売上の閲覧権限。

---

## 6. LiME から A10 への移行方針

現在使っている LiME と最初は併用し、将来的に A10 に置き換える。旧プロジェクトには具体的な移行手順が無かったため、以下を A10 の方針とする（詳細は要確認）。

1. **併用期（段階 1）**: 予約受付は LiME のまま。A10 はカルテ・薬剤配合・写真の記録に使う。顧客は A10 に手入力または CSV 取り込み。
2. **並行期（段階 2）**: A10 の予約作成・上限チェック・LINE 通知が完成したら、スタッフ入力の予約を A10 に移す。二重予約を防ぐため、この期間はどちらを正とするかを日単位で決める。
3. **切替（段階 3）**: お客様向けの予約窓口を A10（Customer App / LINE）に切り替え、LiME の新規受付を停止する。

**移行が必要なデータ**: 顧客（氏名・電話・メール）、今後の予約、過去の来店履歴、カルテ・写真（取り出せる範囲で）。

**必要な機能**（すべて ❌）: 顧客 CSV インポート（電話番号で重複判定）、予約 CSV インポート、取り込み前の検証とプレビュー。

LiME からどの形式でデータを書き出せるかは未確認。

---

## 7. バックアップ・復元

旧版は D1 の標準機能（`wrangler d1` の Time Travel / 復元）に頼る手順メモのみで、A10 では **未実装**。

**要件**

| 仕様 | 状況 |
|---|---|
| D1 の Time Travel による任意時点への復元手順を文書化（本番 DB `a10-hairsalon-prod`） | ❌ |
| 定期的な D1 エクスポート（`wrangler d1 export`）を外部ストレージ（例: R2）に保存し、一定期間保持 | ❌ |
| 施術写真の保存先（例: R2）のバックアップ | ❌ |
| 管理者による CSV エクスポート（顧客・予約・カルテ・売上） | ❌ |
| 復元手順の定期的な試験 | ❌ |

写真・アレルギー情報を含むため、バックアップも本番と同じ扱い（公開しない・アクセス制限）とする。

---

## 8. セキュリティ・個人情報

- 顧客の個人情報（氏名、連絡先、カルテ、アレルギー・健康情報、写真）をリポジトリに置かない。シードデータは架空のものに限る。
- API キー・チャネルシークレット・トークンは `wrangler secret` や Vercel の環境変数で管理し、`wrangler.toml` や `.env` をコミットしない。
- API は認証必須にし、CORS の許可元を本番ドメインに限定する（現在は `*`）。
- 写真の URL は推測できない形式にし、閲覧に権限を必要とする。

---

## 9. 既知の不具合・技術的課題（2026-09-23 時点）

| ID | 内容 |
|---|---|
| B-1 | `POST /api/appointments` が無く、予約を作成できない。Customer App の予約確定は保存しない |
| B-2 | Salon App の予約移動が `PUT /api/appointments`（ID なし）を呼んでおり、API の `PUT /api/appointments/:id` に一致しないため失敗する |
| B-3 | `PUT /api/appointments/:id` が `end_time` を更新しないため、移動すると所要時間が変わる |
| B-4 | LINE 返信の URL が `api.line.biz`（正: `api.line.me`）。署名検証も無い |
| B-5 | API に認証が無い（スタッフ認証を実装済み・本番未反映。§5） |
| B-6 | 各画面が `http://localhost:8787` を直接呼んでおり、本番 API の URL に切り替わらない |
| B-7 | `GET /api/stylists` など一覧 API が `salon_id` で絞り込んでいない |

---

## 10. 今後の優先順位（案）

1. 秘密情報の除去と再発行、API 認証（§8, B-5）
2. 予約作成 API とサーバー側の上限・重複チェック（§2.2〜2.4, B-1〜B-3）
3. 日ごとの予約受付上限・同時受付人数の設定画面（§2.3）
4. 顧客管理・カルテ（施術内容・会話メモ・薬剤配合・アレルギー・写真）（§3）
5. LINE 予約フローの完成と通知（§4）
6. 会計・売上（§3.3）、スタッフ権限（§5）
7. バックアップ・復元（§7）、LiME からのデータ移行（§6）
