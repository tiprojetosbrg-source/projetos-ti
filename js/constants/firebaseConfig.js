// js/constants/firebaseConfig.js
const firebaseConfig = {
  apiKey: "AIzaSyAAWqq3-TcZF8a8x2gOHSAxuyM6GQ4WDqY",
  authDomain: "projetos-ti-brg.firebaseapp.com",
  projectId: "projetos-ti-brg",
  storageBucket: "projetos-ti-brg.firebasestorage.app",
  messagingSenderId: "961380068669",
  appId: "1:961380068669:web:f3c048bdbdbffe78716954",
  measurementId: "G-0V049VPC1E"
};

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const firebaseAuth = firebase.auth();
  const firebaseDb = firebase.firestore();

  // Habilita cache offline nativo com suporte a múltiplas abas abertas
  firebaseDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência offline indisponível: múltiplas abas abertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('Navegador não suporta persistência offline do Firestore.');
    }
  });

  window.firebaseConfig = firebaseConfig;
  window.firebaseAuth = firebaseAuth;
  window.firebaseDb = firebaseDb;
} else {
  console.error('SDK do Firebase não carregado antes de firebaseConfig.js');
}