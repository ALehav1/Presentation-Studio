import { usePresentationStore } from './core/store/presentation';

export default function App() {
  const { currentPresentation, createPresentation } = usePresentationStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold">PresentationStudio</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!currentPresentation ? (
          <div className="text-center py-12">
            <h2 className="text-xl mb-4">Welcome to PresentationStudio</h2>
            <p className="mb-8 text-gray-600">
              Upload slides, add scripts, practice, and deliver perfect presentations.
            </p>
            <button
              onClick={() => createPresentation('New Presentation')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Create New Presentation
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl mb-4">
              Working on: {currentPresentation.title}
            </h2>
            <p className="text-gray-600">
              Slides: {currentPresentation.slides.length}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
