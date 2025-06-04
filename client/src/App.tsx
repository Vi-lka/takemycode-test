import './App.css'
import Header from './components/header'
import List from './components/list'
import ListControls from './components/list/controls'
import QueryProvider from './components/providers/query-provider'
import { ThemeProvider } from './components/providers/theme-provider'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { Toaster } from './components/ui/sonner'

function App() {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          <Header />
          <main className="pt-12 px-6 lg:px-12">
            <ListControls className='mt-6' />
            <List className='mt-6' />
          </main>
          <Toaster />
        </ThemeProvider>
      </QueryProvider>
    </NuqsAdapter>
  )
}

export default App
