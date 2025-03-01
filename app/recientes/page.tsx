import Link from "next/link";
import { Url } from "@/models";
import { format, isValid } from "date-fns";

// Helper function to safely format dates
const safeFormatDate = (dateValue: any) => {
  if (!dateValue) return "N/A";
  
  const date = new Date(dateValue);
  return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm:ss') : "Fecha inválida";
};

export default async function RecentUrls() {
  // Define baseUrl for shortened URLs
  // TODO: REFACTOR
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                 (process.env.NODE_ENV === "production" 
                   ? "https://cortala.pivotnode.net" 
                   : "http://localhost:3000");
  
  // Fetch the 10 most recent URLs from the database
  const recentUrls = await Url.findAll({
    order: [['creationDate', 'DESC']],
    limit: 10
  });

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
            className="flex items-center space-x-2 py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Inicio</span>
          </Link>
          
          <Link 
            href="/recientes" 
            className="flex items-center space-x-2 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
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
            <Link href="/" className="text-gray-700 dark:text-gray-300">Inicio</Link>
            <Link href="/recientes" className="text-gray-900 dark:text-white font-medium">Recientes</Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 md:pt-8 mt-14 md:mt-0">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">URLs Recientes</h1>
            <p className="text-gray-600 dark:text-gray-300">Los últimos 10 enlaces acortados en nuestra plataforma</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 border border-gray-200 dark:border-gray-700 overflow-x-auto">
            {recentUrls.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      URL Original
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      URL Acortada
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha de Expiración
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha de Creación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentUrls.map((url) => (
                    <tr key={url.dataValues.id}>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                        <a 
                          href={url.dataValues.originalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                          title={url.dataValues.originalUrl}
                        >
                          {url.dataValues.originalUrl}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <a 
                          href={`${baseUrl}/${url.dataValues.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600 dark:text-blue-400"
                        >
                          {`${baseUrl}/${url.dataValues.id}`}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {url.expirationDate ? 
                          safeFormatDate(url.dataValues.expirationDate) : 
                          <span className="text-gray-500 dark:text-gray-400">Sin expiración</span>
                        }
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {safeFormatDate(url.dataValues.creationDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 dark:text-gray-300">No hay URLs acortadas recientes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 