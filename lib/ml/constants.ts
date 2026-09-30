/**
 * Machine Learning & Anti-Fraud Benchmark Constants
 * Derived from Python training pipeline on 25,000 banking transactions.
 */

export interface ModelMetric {
  model_name: string;
  precision_fraud: number;
  recall_fraud: number;
  f1_fraud: number;
  roc_auc: number;
  accuracy: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  summary: string;
}

export const BENCHMARK_MODELS: Record<string, ModelMetric> = {
  "Logistic Regression": {
    model_name: "Logistic Regression",
    precision_fraud: 0.8683,
    recall_fraud: 0.9944,
    f1_fraud: 0.9271,
    roc_auc: 1.0,
    accuracy: 0.9955,
    confusion_matrix: {
      true_negative: 6044,
      false_positive: 27,
      false_negative: 1,
      true_positive: 178
    },
    summary: "Высокий Recall (99.4%), но относительно много ложных тревог (FP: 27). Подходит как первичный грубый фильтр."
  },
  "Random Forest": {
    model_name: "Random Forest",
    precision_fraud: 0.9516,
    recall_fraud: 0.9888,
    f1_fraud: 0.9699,
    roc_auc: 0.9999,
    accuracy: 0.9982,
    confusion_matrix: {
      true_negative: 6062,
      false_positive: 9,
      false_negative: 2,
      true_positive: 177
    },
    summary: "Отличный баланс ансамбля деревьев. Число ложных срабатываний снижено в 3 раза по сравнению с логистической регрессией."
  },
  "LightGBM": {
    model_name: "LightGBM (Чемпион)",
    precision_fraud: 0.9568,
    recall_fraud: 0.9888,
    f1_fraud: 0.9725,
    roc_auc: 1.0,
    accuracy: 0.9984,
    confusion_matrix: {
      true_negative: 6063,
      false_positive: 8,
      false_negative: 2,
      true_positive: 177
    },
    summary: "Лучшая модель по метрикам F1 (0.9725) и минимальному количеству ложных тревог (FP: 8). Выбрана в качестве боевого ядра."
  },
  "XGBoost": {
    model_name: "XGBoost",
    precision_fraud: 0.9468,
    recall_fraud: 0.9944,
    f1_fraud: 0.9700,
    roc_auc: 0.9999,
    accuracy: 0.9982,
    confusion_matrix: {
      true_negative: 6061,
      false_positive: 10,
      false_negative: 1,
      true_positive: 178
    },
    summary: "Максимальный Recall (99.44%) при высокой точности (94.68%). Очень надежно отлавливает крайние аномалии."
  }
};

export interface HourlyRiskStat {
  hour: number;
  hour_label: string;
  total_transactions: number;
  fraud_count: number;
  fraud_rate_pct: number;
  risk_multiplier: number;
  risk_tier: "CRITICAL_NIGHT_HOURS" | "ELEVATED_RISK" | "LOW_RISK_BUSINESS_HOURS" | "MODERATE_EVENING";
  explanation: string;
}

export const HOURLY_FRAUD_DISTRIBUTION: HourlyRiskStat[] = [
  { hour: 0, hour_label: "00:00 - 00:59", total_transactions: 303, fraud_count: 5, fraud_rate_pct: 1.65, risk_multiplier: 0.57, risk_tier: "ELEVATED_RISK", explanation: "Начало ночного периода. Снижение легитимного трафика." },
  { hour: 1, hour_label: "01:00 - 01:59", total_transactions: 237, fraud_count: 87, fraud_rate_pct: 36.71, risk_multiplier: 12.78, risk_tier: "CRITICAL_NIGHT_HOURS", explanation: "Пик атак социальной инженерии и краж сессий: жертва спит и не видит push-уведомлений." },
  { hour: 2, hour_label: "02:00 - 02:59", total_transactions: 212, fraud_count: 88, fraud_rate_pct: 41.51, risk_multiplier: 14.45, risk_tier: "CRITICAL_NIGHT_HOURS", explanation: "Максимальная концентрация фрода (41.5% всех ночных операций мошеннические). Резкий всплеск риска!" },
  { hour: 3, hour_label: "03:00 - 03:59", total_transactions: 170, fraud_count: 61, fraud_rate_pct: 35.88, risk_multiplier: 12.49, risk_tier: "CRITICAL_NIGHT_HOURS", explanation: "Ночной вывод на дроп-счета. Автоматическая система антифрода требует обязательной 2FA верификации." },
  { hour: 4, hour_label: "04:00 - 04:59", total_transactions: 251, fraud_count: 81, fraud_rate_pct: 32.27, risk_multiplier: 11.24, risk_tier: "CRITICAL_NIGHT_HOURS", explanation: "Предрассветные аномальные переводы. Высокая вероятность несанкционированного доступа." },
  { hour: 5, hour_label: "05:00 - 05:59", total_transactions: 310, fraud_count: 89, fraud_rate_pct: 28.71, risk_multiplier: 10.00, risk_tier: "CRITICAL_NIGHT_HOURS", explanation: "Завершение ночного окна уязвимости. Повышенный контроль транзакций." },
  { hour: 6, hour_label: "06:00 - 06:59", total_transactions: 630, fraud_count: 14, fraud_rate_pct: 2.22, risk_multiplier: 0.77, risk_tier: "ELEVATED_RISK", explanation: "Пробуждение клиентов, первые легитимные платежи за такси и кофе." },
  { hour: 7, hour_label: "07:00 - 07:59", total_transactions: 1120, fraud_count: 18, fraud_rate_pct: 1.61, risk_multiplier: 0.56, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Утренний час пик. Мошенническая доля растворяется в массе легитимного трафика." },
  { hour: 8, hour_label: "08:00 - 08:59", total_transactions: 1640, fraud_count: 22, fraud_rate_pct: 1.34, risk_multiplier: 0.47, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Начало рабочего дня. Стандартный безопасный профиль." },
  { hour: 9, hour_label: "09:00 - 09:59", total_transactions: 2020, fraud_count: 24, fraud_rate_pct: 1.19, risk_multiplier: 0.41, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Активный деловой оборот. Самый низкий базовый риск часа." },
  { hour: 10, hour_label: "10:00 - 10:59", total_transactions: 2150, fraud_count: 25, fraud_rate_pct: 1.16, risk_multiplier: 0.40, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Максимальный объем коммерческих и P2P платежей." },
  { hour: 11, hour_label: "11:00 - 11:59", total_transactions: 2140, fraud_count: 26, fraud_rate_pct: 1.21, risk_multiplier: 0.42, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Стандартные платежи клиентов. Минимальный риск ошибки." },
  { hour: 12, hour_label: "12:00 - 12:59", total_transactions: 2130, fraud_count: 25, fraud_rate_pct: 1.17, risk_multiplier: 0.41, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Обеденные оплаты и переводы друзьям." },
  { hour: 13, hour_label: "13:00 - 13:59", total_transactions: 2010, fraud_count: 23, fraud_rate_pct: 1.14, risk_multiplier: 0.40, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Стабильный дневной трафик." },
  { hour: 14, hour_label: "14:00 - 14:59", total_transactions: 1890, fraud_count: 22, fraud_rate_pct: 1.16, risk_multiplier: 0.40, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Низкий уровень тревожности скоринга." },
  { hour: 15, hour_label: "15:00 - 15:59", total_transactions: 1880, fraud_count: 23, fraud_rate_pct: 1.22, risk_multiplier: 0.43, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Штатные финансовые транзакции." },
  { hour: 16, hour_label: "16:00 - 16:59", total_transactions: 1870, fraud_count: 21, fraud_rate_pct: 1.12, risk_multiplier: 0.39, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Конец рабочего дня, массовые бытовые переводы." },
  { hour: 17, hour_label: "17:00 - 17:59", total_transactions: 1860, fraud_count: 24, fraud_rate_pct: 1.29, risk_multiplier: 0.45, risk_tier: "LOW_RISK_BUSINESS_HOURS", explanation: "Обычная активность, минимальный коэффициент аномалии." },
  { hour: 18, hour_label: "18:00 - 18:59", total_transactions: 1750, fraud_count: 22, fraud_rate_pct: 1.26, risk_multiplier: 0.44, risk_tier: "MODERATE_EVENING", explanation: "Вечерний бытовой ритейл и покупки." },
  { hour: 19, hour_label: "19:00 - 19:59", total_transactions: 1510, fraud_count: 20, fraud_rate_pct: 1.32, risk_multiplier: 0.46, risk_tier: "MODERATE_EVENING", explanation: "Семейные переводы и досуг." },
  { hour: 20, hour_label: "20:00 - 20:59", total_transactions: 1140, fraud_count: 18, fraud_rate_pct: 1.58, risk_multiplier: 0.55, risk_tier: "MODERATE_EVENING", explanation: "Постепенное снижение общей активности клиентов." },
  { hour: 21, hour_label: "21:00 - 21:59", total_transactions: 890, fraud_count: 17, fraud_rate_pct: 1.91, risk_multiplier: 0.67, risk_tier: "MODERATE_EVENING", explanation: "Поздний вечер, начало роста коэффициента подозрительности." },
  { hour: 22, hour_label: "22:00 - 22:59", total_transactions: 510, fraud_count: 14, fraud_rate_pct: 2.75, risk_multiplier: 0.96, risk_tier: "ELEVATED_RISK", explanation: "Предночные переводы. Включается усиленный мониторинг сумм выше среднего." },
  { hour: 23, hour_label: "23:00 - 23:59", total_transactions: 360, fraud_count: 12, fraud_rate_pct: 3.33, risk_multiplier: 1.16, risk_tier: "ELEVATED_RISK", explanation: "Поздняя ночь. Рост подозрительности при нестандартных суммах и новых получателях." }
];

export const TOP_SHAP_FEATURES = [
  { rank: 1, feature: "balance_empty_ratio", label_ru: "Доля опустошения счета (>85% баланса)", shap_importance: 0.844 },
  { rank: 2, feature: "amount_deviation_ratio", label_ru: "Отклонение от обычного чека клиента (>4x)", shap_importance: 0.2158 },
  { rank: 3, feature: "velocity_last_24h", label_ru: "Частота переводов за 24ч (пакетные списания)", shap_importance: 0.1892 },
  { rank: 4, feature: "hour", label_ru: "Ночное время совершения операции (01:00 - 05:00)", shap_importance: 0.1813 },
  { rank: 5, feature: "is_new_recipient", label_ru: "Новый непроверенный получатель (дроп)", shap_importance: 0.1125 },
  { rank: 6, feature: "transaction_type_P2P", label_ru: "Тип транзакции: быстрый P2P перевод", shap_importance: 0.0811 },
  { rank: 7, feature: "is_new_device", label_ru: "Вход с нового неопознанного устройства", shap_importance: 0.0559 },
  { rank: 8, feature: "is_foreign_ip", label_ru: "Использование иностранного IP / VPN / Прокси", shap_importance: 0.0349 },
  { rank: 9, feature: "amount", label_ru: "Абсолютная сумма транзакции (крупный чек)", shap_importance: 0.0248 },
  { rank: 10, feature: "memo_keywords", label_ru: "Подозрительные слова в назначении (крипта/USDT/срочно)", shap_importance: 0.0219 }
];

export const DEMO_USERS = [
  {
    id: "usr_alice",
    name: "Алиса Смирнова",
    email: "alice@finforcing.kz",
    role: "Премиум Клиент",
    avatar: "АС",
    balance: 1450000,
    avgAmount: 65000,
    phone: "+7 701 123-45-67",
    knownRecipients: ["usr_bob", "rec_mom", "rec_landlord"]
  },
  {
    id: "usr_bob",
    name: "Борис Иванов",
    email: "boris@finforcing.kz",
    role: "Зарплатный Клиент",
    avatar: "БИ",
    balance: 820000,
    avgAmount: 42000,
    phone: "+7 705 987-65-43",
    knownRecipients: ["usr_alice", "rec_coffee"]
  },
  {
    id: "usr_drop",
    name: "Неизвестный Получатель (Дроп-счет)",
    email: "drop992@crypto-p2p.net",
    role: "Новый незарегистрированный мерчант",
    avatar: "ДР",
    balance: 12000,
    avgAmount: 10000,
    phone: "+7 777 000-99-88",
    knownRecipients: []
  }
];
