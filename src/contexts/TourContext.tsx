import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

export interface TourStep {
  targetSelector?: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
  specialAction?: 'swipe-right' | 'swipe-left' | 'pulse-button';
}

interface TourContextType {
  steps: TourStep[];
  currentStepIndex: number;
  isActive: boolean;
  isLoaded: boolean;
  startTour: () => void;
  startProfileTour: () => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  hasSeenTour: boolean;
  tourType: 'main' | 'profile';
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [tourType, setTourType] = useState<'main' | 'profile'>('main');

  // Detect if user is an entrepreneur to customize steps
  const isEmprendedor = user?.user_metadata?.role === 'emprendedor';

  // Define default steps
  const [steps, setSteps] = useState<TourStep[]>([]);

  useEffect(() => {
    const baseSteps: TourStep[] = [
      {
        title: "¡Bienvenido a CampusMarket!",
        description: "Nos alegra tenerte aquí. Vamos a darte un recorrido rápido de 1 minuto para que le saques el máximo provecho a la aplicación. ¡Es muy sencillo!",
        placement: "center",
        icon: "rocket"
      },
      {
        targetSelector: '[data-tour="nav-home"]',
        title: "Tu Feed de Inicio",
        description: "Aquí es donde sucede la magia. Podrás ver los productos, servicios y creaciones más recientes de tus compañeros universitarios.",
        placement: "top",
        icon: "home"
      },
      {
        targetSelector: '[data-tour="nav-search"]',
        title: "Busca Productos o Servicios",
        description: "Utiliza la herramienta de búsqueda para localizar artículos específicos, categorías o emprendedores en particular al instante.",
        placement: "top",
        icon: "search"
      },
      {
        targetSelector: '[data-tour="nav-explore"]',
        title: "Explora y calma tus antojos",
        description: "¿Tienes antojo de algo dulce, comida rápida o buscas novedades? Descubre y conoce en profundidad todos los negocios universitarios aquí.",
        placement: "top",
        icon: "explore"
      },
      {
        targetSelector: '[data-tour="notifications"]',
        title: "Mantente al tanto",
        description: "Recibe alertas en tiempo real cuando alguien califique tu producto, haya novedades o recibas respuestas.",
        placement: "bottom",
        icon: "bell"
      },
      {
        targetSelector: '[data-tour="nav-chats"]',
        title: "Mensajería Directa",
        description: "Comunícate al instante con compradores o vendedores sin salir de la plataforma. ¡Rápido y seguro!",
        placement: "top",
        icon: "send"
      },
    ];

    // Insert Upload step only for Entrepreneurs
    if (isEmprendedor) {
      baseSteps.push({
        targetSelector: '[data-tour="nav-upload"]',
        title: "Publica tu Emprendimiento",
        description: "¡Esta es tu herramienta principal! Sube fotos de tus productos, fija precios y compártelos con todo el campus en segundos.",
        placement: "top",
        icon: "plus"
      });
    }

    // Add Profile step
    baseSteps.push({
      targetSelector: '[data-tour="nav-profile"]',
      title: "Tu Perfil",
      description: "Administra tu información, visualiza tus compras, tus pedidos pendientes y personaliza cómo te ve la comunidad.",
      placement: "top",
      icon: "user"
    });

    // Add conditional "Complete your profile" warning step
    const hasCompletedProfileLocal = localStorage.getItem('profileCompleted') === 'true';
    const hasCompletedProfileMeta = user?.user_metadata?.profile_completed === true;
    
    if (!hasCompletedProfileLocal && !hasCompletedProfileMeta) {
      baseSteps.push({
        targetSelector: '[data-tour="nav-profile"]',
        title: "Completa tu Perfil",
        description: "¡Casi terminas! Te recomendamos ir a tu perfil y completar tu información de contacto y biografía. De esta forma, otros miembros del campus podrán comprarte o contactarte mucho más rápido.",
        placement: "top",
        icon: "check-circle"
      });
    }

    setSteps(baseSteps);
  }, [isEmprendedor, user]);

  // Load initial tour state from localStorage or user metadata
  useEffect(() => {
    if (!user) {
      setHasSeenTour(false);
      setIsActive(false);
      setIsLoaded(true);
      return;
    }

    const localSeen = localStorage.getItem('hasSeenAppTour') === 'true';
    const metadataSeen = user.user_metadata?.has_seen_tour === true;

    setHasSeenTour(localSeen || metadataSeen);
    setIsLoaded(true);
  }, [user]);

  const startTour = () => {
    setTourType('main');
    const baseSteps: TourStep[] = [
      {
        title: "¡Bienvenido a CampusMarket!",
        description: "Nos alegra tenerte aquí. Vamos a darte un recorrido rápido de 1 minuto para que le saques el máximo provecho a la aplicación. ¡Es muy sencillo!",
        placement: "center",
        icon: "rocket"
      },
      {
        targetSelector: '[data-tour="nav-home"]',
        title: "Tu Feed de Inicio",
        description: "Aquí es donde sucede la magia. Podrás ver los productos, servicios y creaciones más recientes de tus compañeros universitarios.",
        placement: "top",
        icon: "home"
      },
      {
        targetSelector: '[data-tour="nav-search"]',
        title: "Busca Productos o Servicios",
        description: "Utiliza la herramienta de búsqueda para localizar artículos específicos, categorías o emprendedores en particular al instante.",
        placement: "top",
        icon: "search"
      },
      {
        targetSelector: '[data-tour="nav-explore"]',
        title: "Explora y calma tus antojos",
        description: "¿Tienes antojo de algo dulce, comida rápida o buscas novedades? Descubre y conoce en profundidad todos los negocios universitarios aquí.",
        placement: "top",
        icon: "explore"
      },
      {
        targetSelector: '[data-tour="notifications"]',
        title: "Mantente al tanto",
        description: "Recibe alertas en tiempo real cuando alguien califique tu producto, haya novedades o recibas respuestas.",
        placement: "bottom",
        icon: "bell"
      },
      {
        targetSelector: '[data-tour="nav-chats"]',
        title: "Mensajería Directa",
        description: "Comunícate al instante con compradores o vendedores sin salir de la plataforma. ¡Rápido y seguro!",
        placement: "top",
        icon: "send"
      },
    ];

    if (isEmprendedor) {
      baseSteps.push({
        targetSelector: '[data-tour="nav-upload"]',
        title: "Publica tu Emprendimiento",
        description: "¡Esta es tu herramienta principal! Sube fotos de tus productos, fija precios y compártelos con todo el campus en segundos.",
        placement: "top",
        icon: "plus"
      });
    }

    baseSteps.push({
      targetSelector: '[data-tour="nav-profile"]',
      title: "Tu Perfil",
      description: "Administra tu información, visualiza tus compras, tus pedidos pendientes y personaliza cómo te ve la comunidad.",
      placement: "top",
      icon: "user"
    });

    const hasCompletedProfileLocal = localStorage.getItem('profileCompleted') === 'true';
    const hasCompletedProfileMeta = user?.user_metadata?.profile_completed === true;
    
    if (!hasCompletedProfileLocal && !hasCompletedProfileMeta) {
      baseSteps.push({
        targetSelector: '[data-tour="nav-profile"]',
        title: "Completa tu Perfil",
        description: "¡Casi terminas! Te recomendamos ir a tu perfil y completar tu información de contacto y biografía. De esta forma, otros miembros del campus podrán comprarte o contactarte mucho más rápido.",
        placement: "top",
        icon: "check-circle"
      });
    }

    setSteps(baseSteps);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const startProfileTour = () => {
    setTourType('profile');
    const profileSteps: TourStep[] = [
      {
        title: "Tu Centro de Control",
        description: "Este es tu perfil personal. Aquí puedes gestionar todo lo relacionado con tu cuenta y tus publicaciones.",
        placement: "center",
        icon: "user"
      },
      {
        targetSelector: '[data-tour="profile-header"]',
        title: "Estadísticas Rápidas",
        description: "Mira de un vistazo cuántas publicaciones tienes, tus seguidores y tus ventas logradas.",
        placement: "bottom",
        icon: "rocket"
      },
      {
        targetSelector: '[data-tour="edit-profile"]',
        title: "Personaliza tu Marca",
        description: "Cambia tu foto, biografía y enlaces de contacto para que tu perfil destaque.",
        placement: "bottom",
        icon: "settings"
      },
      {
        targetSelector: '[data-tour="tab-saved"]',
        title: "Tus Guardados",
        description: "Aquí puedes ver todos los productos que has guardado para ver más tarde. ¡No pierdas de vista lo que te gusta!",
        placement: "bottom",
        icon: "bookmark"
      },
      {
        targetSelector: '[data-tour="tab-reviews"]',
        title: "Tus Reseñas",
        description: "Mira lo que otros usuarios dicen de ti o las valoraciones que has dejado. ¡Tu reputación es clave!",
        placement: "bottom",
        icon: "star"
      }
    ];

    setSteps(profileSteps);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const stopTour = async () => {
    setIsActive(false);
    setHasSeenTour(true);
    localStorage.setItem('hasSeenAppTour', 'true');
    
    // Update in Supabase
    try {
      await supabase.auth.updateUser({
        data: { has_seen_tour: true }
      });
    } catch (err) {
      console.error('Failed to persist tour preference to Supabase:', err);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      stopTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <TourContext.Provider
      value={{
        steps,
        currentStepIndex,
        isActive,
        isLoaded,
        startTour,
        startProfileTour,
        stopTour,
        nextStep,
        prevStep,
        hasSeenTour,
        tourType,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
