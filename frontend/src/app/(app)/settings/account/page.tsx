// Эта страница нужна только для прямого захода/рефреша на /settings/account —
// сама модалка рендерится компонентом Sidebar (он смонтирован в layout выше
// по дереву и следит за pathname через useSettingsRoute). Контент здесь не
// нужен, т.к. модалка полностью перекрывает эту "пустую" страницу.

export default function SettingsAccountPage() {
  return null;
}
