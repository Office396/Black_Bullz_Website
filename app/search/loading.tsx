export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-4">
          <video autoPlay loop muted className="w-full h-full object-contain">
            <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/700_F_669683156_9EPE8bLAvgoRhMnBfGOSQF6CGLKhsEEe_ST%20%28online-video-cutter.com%29-9p0CdowwI5OwXM4iOSRhEsn6F3lxo3.mp4" type="video/mp4" />
          </video>
        </div>
        <p className="text-white text-lg font-semibold">Loading...</p>
      </div>
    </div>
  )
}
