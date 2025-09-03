'use client'

export default function LoadingPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-blue-600 font-semibold">Loading...</div>
            </div>
        </main>
    )
}