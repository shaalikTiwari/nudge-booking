export default function PhonePreview({ message, businessName }) {
    return (
      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="rounded-[2rem] border-[6px] border-ink bg-ink p-2 shadow-2xl">
          <div className="rounded-[1.5rem] bg-[#0B141A] overflow-hidden">
            <div className="flex items-center gap-2 bg-brand-500 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-display font-bold text-sm">
                {businessName?.[0] || 'N'}
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">{businessName || 'Your Business'}</p>
                <p className="text-brand-100 text-xs leading-tight">WhatsApp</p>
              </div>
            </div>
  
            <div className="min-h-[220px] bg-[#0B141A] px-3 py-4 flex flex-col justify-end gap-2">
              {message ? (
                <div className="self-start max-w-[85%] rounded-2xl rounded-tl-sm bg-[#1F2C34] px-3 py-2">
                  <p className="text-[13px] text-white leading-snug whitespace-pre-line">{message}</p>
                  <p className="text-[10px] text-gray-400 text-right mt-1">now</p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center">
                  Fill the form — your customer's confirmation message shows up here, live.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }