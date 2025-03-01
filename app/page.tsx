'use client';
import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");

  // Update the expiration date when the toggle changes
  useEffect(() => {
    if (hasExpiration) {
      // Set default expiration to current date + 1 day
      setExpirationDate(getDefaultExpirationDate());
    }
  }, [hasExpiration]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShortUrl("");
    
    try {
      const payload: any = { originalUrl: url };
      
      if (hasExpiration && expirationDate) {
        // Convert the displayed date format (dd/mm/yyyy hh:mm) to ISO format for API
        payload.expirationDate = formatDateForAPI(expirationDate);
      }
      
      const response = await fetch('/api/shorten-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al acortar la URL');
      }
      
      const data = await response.json();
      setShortUrl(data.shortUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al acortar la URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Get default expiration date (current date + 1 day)
  const getDefaultExpirationDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    
    // Format as dd/mm/yyyy hh:mm
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Get current date formatted for example
  const getCurrentDateExample = () => {
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Convert from dd/mm/yyyy hh:mm to ISO format for API
  const formatDateForAPI = (dateString: string) => {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart ? timePart.split(':') : ['00', '00'];
    
    // Create ISO format: YYYY-MM-DDTHH:MM:SS
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  };

  // Check if the selected date is valid (at least 5 minutes in the future)
  const isValidExpirationDate = (dateString: string) => {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [day, month, year] = datePart.split('/').map(Number);
      const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];
      
      const inputDate = new Date(year, month - 1, day, hours, minutes);
      const minDate = new Date();
      minDate.setMinutes(minDate.getMinutes() + 5);
      
      return inputDate >= minDate;
    } catch (error) {
      return false;
    }
  };

  const handleExpirationToggle = (isChecked: boolean) => {
    setHasExpiration(isChecked);
  };

  // Handle manual date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpirationDate(e.target.value);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar/Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-md p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cortala</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tu acortador de URLs</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/" 
            className="flex items-center space-x-2 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Inicio</span>
          </Link>
          
          <Link 
            href="/recientes" 
            className="flex items-center space-x-2 py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>URLs Recientes</span>
          </Link>
        </div>
        
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>© {new Date().getFullYear()} Cortala</p>
            <p>Servicio Gratuito</p>
          </div>
        </div>
      </nav>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md p-4 z-10">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cortala</h2>
          <div className="flex space-x-4">
            <Link href="/" className="text-gray-900 dark:text-white font-medium">Inicio</Link>
            <Link href="/recientes" className="text-gray-700 dark:text-gray-300">Recientes</Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Acorta tus enlaces en segundos
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              La forma más rápida y sencilla de crear links cortos para compartir en redes sociales, mensajes o correos.
            </p>
          </div>
          
          {/* URL Shortener Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 mb-10 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Ingresa el enlace que quieres acortar
                </label>
                <div className="relative">
                  <input
                    id="url"
                    name="url"
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="expiration-toggle" 
                    checked={hasExpiration}
                    onChange={(e) => handleExpirationToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div 
                    className={`w-11 h-6 rounded-full peer-focus:ring-2 peer-focus:ring-gray-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${hasExpiration ? 'bg-blue-600 dark:bg-blue-500 after:translate-x-full' : 'bg-gray-300 dark:bg-gray-700'}`}
                    onClick={() => handleExpirationToggle(!hasExpiration)}
                  ></div>
                  <span className="ml-3 text-sm font-medium text-gray-800 dark:text-gray-200">
                    Establecer fecha de expiración
                  </span>
                </div>
              </div>
              
              {hasExpiration && (
                <div>
                  <label htmlFor="expiration-date" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                    Fecha y hora de expiración
                  </label>
                  <input
                    id="expiration-date"
                    type="text"
                    value={expirationDate}
                    onChange={handleDateChange}
                    placeholder="dd/mm/yyyy hh:mm"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Formato: dd/mm/yyyy hh:mm (por ejemplo, {getCurrentDateExample()})
                  </p>
                  <div className="mt-2 flex items-start space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Por defecto, se ha establecido un tiempo de expiración de 1 día. Puedes modificarlo según tus necesidades.
                    </p>
                  </div>
                  {expirationDate && !isValidExpirationDate(expirationDate) && (
                    <p className="mt-1 text-sm text-red-500">
                      La fecha de expiración debe ser al menos 5 minutos en el futuro
                    </p>
                  )}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || (hasExpiration && !isValidExpirationDate(expirationDate))}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Procesando...' : 'Acortar URL'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {shortUrl && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">¡URL acortada con éxito!</h3>
                <div className="flex items-center gap-2">
                  {/* <input 
                    type="text"
                    readOnly
                    value={shortUrl}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-gray-800 dark:text-white"
                  /> */}
                  {/* Clickable Link */}
                <a 
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded text-gray-800 dark:text-white text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                >
                  {shortUrl}
                </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shortUrl);
                      alert("URL copiada al portapapeles");
                    }}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </button>
                </div>
                {hasExpiration && expirationDate && (
                  <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                    Este enlace expirará el: {expirationDate}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Rápido y Simple</h3>
              <p className="text-gray-700 dark:text-gray-300">Acorta tus URLs con un solo clic, sin registros obligatorios.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Totalmente Gratis</h3>
              <p className="text-gray-700 dark:text-gray-300">Servicio 100% gratuito, sin costos ocultos ni limitaciones.</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Historial de URLs</h3>
              <p className="text-gray-700 dark:text-gray-300">Accede a tus enlaces acortados recientes fácilmente.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
