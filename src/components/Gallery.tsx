import React from 'react';
import { motion } from 'motion/react';
import { Camera, Maximize2 } from 'lucide-react';
import { GalleryImage } from '../lib/adminStore';

interface GalleryProps {
  galleryRef: React.RefObject<HTMLDivElement>;
  images: GalleryImage[];
}

const Gallery: React.FC<GalleryProps> = ({ galleryRef, images }) => {
  return (
    <section 
      ref={galleryRef} 
      className="py-24 px-6 bg-white overflow-hidden" 
      id="section-gallery"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-saffron/10 px-3 py-1 rounded-full border border-saffron/20">
            <Camera className="w-3.5 h-3.5 text-saffron" />
            <span className="text-[10px] font-bold text-saffron tracking-widest uppercase font-mono">Visual Journey</span>
          </div>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-charcoal tracking-tight">
            Capturing the Essence <br/> of Curry Delight
          </h2>
          <p className="text-sm md:text-base text-charcoal/60 leading-relaxed font-normal">
            Take a look at the vibrant colors, authentic textures, and the inviting atmosphere that make our kitchen a local favorite in Kahalgaon.
          </p>
        </div>

        {/* Bento Grid Gallery */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image, index) => (
              <motion.div
                key={`${image.url}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative group rounded-3xl overflow-hidden shadow-sm border border-charcoal/5 bg-charcoal/5 cursor-pointer ${
                  index === 0 ? 'md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 aspect-square md:aspect-auto' : 'aspect-square'
                }`}
              >
                <img 
                  src={image.url} 
                  alt={image.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 text-left">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-saffron uppercase tracking-widest block">
                      {image.category}
                    </span>
                    <h3 className="font-display font-bold text-xl md:text-2xl text-white">
                      {image.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-white/60 text-xs">
                      <Maximize2 className="w-3 h-3" />
                      <span>View Detail</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Maximize2 className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-charcoal/40">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-bold">No gallery images yet. Add images from your Admin Dashboard.</p>
          </div>
        )}

        {/* Bottom CTA or Info */}
        <div className="pt-8 text-center">
          <p className="text-[11px] font-mono text-charcoal/40 uppercase tracking-widest font-bold">
            All images are authentic representations of our culinary craft
          </p>
        </div>
      </div>
    </section>
  );
};

export default Gallery;

