import { MenuItem } from './types';

const CATEGORY_IMAGES: Record<string, string> = {
  'French Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  'Sandwiches': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=600&q=80',
  'Rolls': 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
  'Pizza Hub': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  'Mocktails, Shakes & Beverages': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'Soups': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
  'Starters (Veg)': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
  'Starters (Non-Veg)': 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
  'From the Tandoor (Veg)': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80',
  'From the Tandoor (Non-Veg)': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80',
  'Noodle Junction': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80',
  'Chinese Gravies': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  'Classic Indian Gravies (Veg)': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
  'Classic Indian Gravies (Non-Veg)': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
  'Rice & Biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=600&q=80',
  'Indian Breads': 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=600&q=80',
  'Desserts & Accompaniments': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
  'Heritage Thalis': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'
};

function generateDescription(name: string, category: string): string {
  if (category.includes('Fries')) {
    return `Golden, crispy, and perfectly seasoned ${name}, cooked to perfection. A perfect side for any meal!`;
  }
  if (category.includes('Sandwich')) {
    return `Freshly made ${name}, filled with premium ingredients, toasted golden-brown, and served with house special chutney.`;
  }
  if (category.includes('Roll')) {
    return `Soft, warm flatbread rolled with a delicious spiced filling of ${name.toLowerCase()}, mint mayo, and crisp pickled onions.`;
  }
  if (category.includes('Pizza')) {
    return `Freshly baked hand-tossed crust topped with rich tomato sauce, premium mozzarella cheese, and ${name.replace(' Pizza', '').toLowerCase()} toppings.`;
  }
  if (category.includes('Beverages') || category.includes('Mocktails') || category.includes('Shakes')) {
    return `A refreshing, icy-cold glass of premium ${name.toLowerCase()}, crafted with fresh ingredients to quench your thirst.`;
  }
  if (category.includes('Soups')) {
    return `A warm, soothing, and deeply flavorful bowl of ${name.toLowerCase()}, prepared fresh daily with authentic aromatic herbs and spices.`;
  }
  if (category.includes('Starters') || category.includes('Tandoor')) {
    return `A succulent and mouth-watering starter of ${name.toLowerCase()}, marinated in our chef's signature spiced yogurt blend and charred beautifully.`;
  }
  if (category.includes('Noodle') || category.includes('Chinese')) {
    return `Wok-tossed hot ${name.toLowerCase()} with crisp fresh garden vegetables, premium sauces, and authentic Indo-Chinese seasonings.`;
  }
  if (category.includes('Indian Gravies') || category.includes('Mutton')) {
    return `A slow-simmered, rich, and aromatic classic gravy of ${name.toLowerCase()}, prepared using cold-pressed oils, fresh cream, and stone-ground heritage spices.`;
  }
  if (category.includes('Rice') || category.includes('Biryani')) {
    return `Fragrant, long-grain classic basmati rice layered beautifully with rich aromatics, fresh herbs, saffron, and tender ${name.toLowerCase()}.`;
  }
  if (category.includes('Breads')) {
    return `Soft, fresh, and perfectly blistered ${name.toLowerCase()} baked in our traditional ultra-hot tandoor clay oven.`;
  }
  if (category === 'Heritage Thalis') {
    if (name.includes('Veg Thali')) {
      return `An opulent royal platter featuring Paneer Butter Masala, Dal Makhani, Mix Veg, Steamed Basmati Rice, 2 Butter Tandoori Rotis, Gulab Jamun, Papad, and Raita. Swappable and customizable!`;
    }
    if (name.includes('Chicken Thali')) {
      return `A rustic local heritage special platter featuring our signature Dehati Chicken Curry, Dal Fry, Jeera Rice, 2 Butter Tandoori Rotis, Green Salad, Papad, and Gulab Jamun. Swappable and customizable!`;
    }
    return `Our supreme ultimate family grand thali feast: Kadhai Paneer, Dal Makhani, Veg Pulao, 2 Garlic Naans, Butter Roti, Gulab Jamun, Veg Raita, Salad, and Roasted Papad.`;
  }
  return `Our signature, freshly prepared ${name.toLowerCase()} cooked using authentic ingredients and traditional family cooking styles.`;
}

const compactItems: Array<[string, string, number, string, boolean, ('mild' | 'medium' | 'hot')?]> = [
  // --- FRENCH FRIES ---
  ['fries-salted-small', 'Salted French Fries (Small)', 80, 'French Fries', true],
  ['fries-salted-med', 'Salted French Fries (Medium)', 110, 'French Fries', true],
  ['fries-salted-full', 'Salted French Fries (Full)', 140, 'French Fries', true],
  ['fries-peri-small', 'Peri-Peri French Fries (Small)', 100, 'French Fries', true, 'medium'],
  ['fries-peri-med', 'Peri-Peri French Fries (Medium)', 130, 'French Fries', true, 'medium'],
  ['fries-peri-full', 'Peri-Peri French Fries (Full)', 160, 'French Fries', true, 'medium'],

  // --- SANDWICHES ---
  ['sw-veg', 'Veg Sandwich', 65, 'Sandwiches', true],
  ['sw-grilled-veg', 'Grilled Veg Sandwich', 80, 'Sandwiches', true],
  ['sw-grilled-cheese', 'Grilled Veg Cheese Sandwich', 80, 'Sandwiches', true],
  ['sw-grilled-club', 'Grilled Veg Club Sandwich', 110, 'Sandwiches', true],
  ['sw-grilled-paneer', 'Grilled Paneer Sandwich', 70, 'Sandwiches', true],
  ['sw-grilled-paneer-cheese', 'Grilled Paneer Cheese Sandwich', 90, 'Sandwiches', true],
  ['sw-grilled-chicken', 'Grilled Chicken Sandwich', 110, 'Sandwiches', false, 'medium'],
  ['sw-grilled-chicken-cheese', 'Grilled Chicken Cheese Sandwich', 180, 'Sandwiches', false, 'medium'],
  ['sw-grilled-chicken-club', 'Grilled Chicken Club Sandwich', 110, 'Sandwiches', false, 'medium'],
  ['sw-special', 'Curry Delight Spl. Grilled Sandwich', 130, 'Sandwiches', true, 'medium'],

  // --- ROLLS ---
  ['roll-egg', 'Egg Roll', 110, 'Rolls', false, 'medium'],
  ['roll-paneer', 'Paneer Roll', 130, 'Rolls', true, 'medium'],
  ['roll-chicken', 'Chicken Roll', 210, 'Rolls', false, 'medium'],
  ['roll-db-egg-chicken', 'Double Egg Chicken Roll', 160, 'Rolls', false, 'medium'],

  // --- PIZZA HUB ---
  ['pizza-veg-sm', 'Veggie Pizza (Small)', 120, 'Pizza Hub', true],
  ['pizza-veg-md', 'Veggie Pizza (Medium)', 180, 'Pizza Hub', true],
  ['pizza-veg-over-sm', 'Veggie Overloaded Pizza (Small)', 160, 'Pizza Hub', true],
  ['pizza-veg-over-md', 'Veggie Overloaded Pizza (Medium)', 240, 'Pizza Hub', true],
  ['pizza-peppy-pan-sm', 'Peppy Paneer Pizza (Small)', 130, 'Pizza Hub', true, 'medium'],
  ['pizza-peppy-pan-md', 'Peppy Paneer Pizza (Medium)', 180, 'Pizza Hub', true, 'medium'],
  ['pizza-tand-pan-sm', 'Tandoori Paneer Pizza (Small)', 170, 'Pizza Hub', true, 'medium'],
  ['pizza-tand-pan-md', 'Tandoori Paneer Pizza (Medium)', 240, 'Pizza Hub', true, 'medium'],
  ['pizza-kad-pan-sm', 'Kadhai Paneer Pizza (Small)', 170, 'Pizza Hub', true, 'medium'],
  ['pizza-kad-pan-md', 'Kadhai Paneer Pizza (Medium)', 240, 'Pizza Hub', true, 'medium'],
  ['pizza-margh-sm', 'Margherita Pizza (Small)', 90, 'Pizza Hub', true],
  ['pizza-margh-md', 'Margherita Pizza (Medium)', 160, 'Pizza Hub', true],
  ['pizza-pan-tikka-sm', 'Paneer Tikka Pizza (Small)', 170, 'Pizza Hub', true, 'medium'],
  ['pizza-pan-tikka-md', 'Paneer Tikka Pizza (Medium)', 240, 'Pizza Hub', true, 'medium'],
  ['pizza-peppy-chk-sm', 'Peppy Chicken Pizza (Small)', 130, 'Pizza Hub', false, 'medium'],
  ['pizza-peppy-chk-md', 'Peppy Chicken Pizza (Medium)', 180, 'Pizza Hub', false, 'medium'],
  ['pizza-chk-tikka-sm', 'Chicken Tikka Pizza (Small)', 170, 'Pizza Hub', false, 'medium'],
  ['pizza-chk-tikka-md', 'Chicken Tikka Pizza (Medium)', 240, 'Pizza Hub', false, 'medium'],
  ['pizza-margh-chk-sm', 'Margherita Chicken Pizza (Small)', 110, 'Pizza Hub', false],
  ['pizza-margh-chk-md', 'Margherita Chicken Pizza (Medium)', 190, 'Pizza Hub', false],
  ['pizza-tand-chk-sm', 'Tandoori Chicken Pizza (Small)', 170, 'Pizza Hub', false, 'medium'],
  ['pizza-tand-chk-md', 'Tandoori Chicken Pizza (Medium)', 240, 'Pizza Hub', false, 'medium'],
  ['pizza-kad-chk-sm', 'Kadhai Chicken Pizza (Small)', 170, 'Pizza Hub', false, 'medium'],
  ['pizza-kad-chk-md', 'Kadhai Chicken Pizza (Medium)', 240, 'Pizza Hub', false, 'medium'],

  // --- MOCKTAILS, SHAKES & BEVERAGES ---
  ['mock-mint', 'Mint Mojito', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-mango', 'Mango Mojito', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-orange', 'Orange Mojito', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-litchi', 'Litchi Punch', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-keri', 'Kacchi Keri Mojito', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-apple', 'Green Apple Mojito', 70, 'Mocktails, Shakes & Beverages', true],
  ['mock-lagoon', 'Blue Lagoon', 70, 'Mocktails, Shakes & Beverages', true],
  ['shake-kesar', 'Kesar Badam Milkshake', 110, 'Mocktails, Shakes & Beverages', true],
  ['shake-choco', 'Chocolate Milkshake', 120, 'Mocktails, Shakes & Beverages', true],
  ['shake-straw', 'Strawberry Milkshake', 110, 'Mocktails, Shakes & Beverages', true],
  ['shake-scotch', 'Butterscotch Milkshake', 120, 'Mocktails, Shakes & Beverages', true],
  ['shake-oreo', 'Oreo Milkshake', 130, 'Mocktails, Shakes & Beverages', true],
  ['shake-mango', 'Mango Shake', 120, 'Mocktails, Shakes & Beverages', true],
  ['bev-tea', 'Tea', 20, 'Mocktails, Shakes & Beverages', true],
  ['bev-coffee', 'Hot Coffee', 40, 'Mocktails, Shakes & Beverages', true],
  ['bev-cold-coffee', 'Cold Coffee', 90, 'Mocktails, Shakes & Beverages', true],
  ['bev-cold-icecream', 'Cold Coffee with Ice cream', 120, 'Mocktails, Shakes & Beverages', true],
  ['bev-beer', 'Non-Alcoholic Beer', 150, 'Mocktails, Shakes & Beverages', true],

  // --- SOUPS ---
  ['soup-veg-clear', 'Veg Clear Soup', 80, 'Soups', true],
  ['soup-tomato', 'Cream of Tomato Soup', 120, 'Soups', true],
  ['soup-lemon-corr', 'Lemon Coriander Soup', 120, 'Soups', true],
  ['soup-sweetcorn', 'Sweet Corn Soup', 110, 'Soups', true],
  ['soup-manchow', 'Veg Manchow Soup', 110, 'Soups', true, 'medium'],
  ['soup-hot-sour', 'Veg Hot and Sour Soup', 110, 'Soups', true, 'hot'],
  ['soup-chk-clear', 'Chicken Clear Soup', 90, 'Soups', false],
  ['soup-chk-lemon', 'Lemon Coriander Chicken Soup', 140, 'Soups', false],
  ['soup-chk-manchow', 'Chicken Manchow Soup', 130, 'Soups', false, 'medium'],
  ['soup-chk-hotsour', 'Chicken Hot and Sour Soup', 130, 'Soups', false, 'hot'],
  ['soup-lung-fung', 'Lung-Fung Chicken Soup', 140, 'Soups', false, 'medium'],

  // --- STARTERS VEG ---
  ['starter-paneer-pakoda', 'Paneer Pakoda', 180, 'Starters (Veg)', true],
  ['starter-paneer-65', 'Paneer 65', 210, 'Starters (Veg)', true, 'medium'],
  ['starter-chilli-paneer-dry', 'Chilli Paneer Dry', 190, 'Starters (Veg)', true, 'medium'],
  ['starter-schez-paneer-dry', 'Schezwan Chilli Paneer Dry', 210, 'Starters (Veg)', true, 'hot'],
  ['starter-paneer-popcorn', 'Paneer Popcorn', 180, 'Starters (Veg)', true],
  ['starter-honey-potato', 'Honey Chilli Potato', 140, 'Starters (Veg)', true, 'medium'],
  ['starter-veg-manch-dry', 'Veg Manchurian Dry', 180, 'Starters (Veg)', true, 'medium'],
  ['starter-babycorn-manch', 'Babycorn Manchurian', 210, 'Starters (Veg)', true, 'medium'],
  ['starter-crispy-babycorn', 'Crispy Chilli Babycorn', 220, 'Starters (Veg)', true, 'medium'],
  ['starter-chilli-mushroom', 'Chilli Mushroom', 200, 'Starters (Veg)', true, 'medium'],
  ['starter-garlic-mushroom', 'Butter Garlic Mushroom', 210, 'Starters (Veg)', true],
  ['starter-crispy-corn', 'Crispy Corn', 190, 'Starters (Veg)', true, 'medium'],

  // --- STARTERS NON-VEG ---
  ['starter-egg-pakoda', 'Egg Pakoda', 130, 'Starters (Non-Veg)', false],
  ['starter-chk-popcorn', 'Chicken Popcorn', 190, 'Starters (Non-Veg)', false],
  ['starter-chk-pakoda', 'Chicken Pakoda', 190, 'Starters (Non-Veg)', false],
  ['starter-chk-lollipop', 'Chicken Lollipop (6pc)', 290, 'Starters (Non-Veg)', false, 'medium'],
  ['starter-chilli-chk-dry', 'Chilli Chicken Dry', 210, 'Starters (Non-Veg)', false, 'medium'],
  ['starter-schez-chk-dry', 'Schezwan Chilli Chicken', 220, 'Starters (Non-Veg)', false, 'hot'],
  ['starter-chk-65', 'Chicken 65', 220, 'Starters (Non-Veg)', false, 'medium'],
  ['starter-garlic-lemon-chk', 'Garlic Lemon Chicken', 230, 'Starters (Non-Veg)', false],
  ['starter-kung-pao-chk', 'Kung Pao Chicken', 240, 'Starters (Non-Veg)', false, 'medium'],
  ['starter-mutton-bhuna-dry', 'Mutton Bhuna Dry', 290, 'Starters (Non-Veg)', false, 'hot'],

  // --- FROM THE TANDOOR VEG ---
  ['tand-paneer-tikka', 'Paneer Tikka', 230, 'From the Tandoor (Veg)', true, 'medium'],
  ['tand-achari-paneer', 'Achari Paneer Tikka', 240, 'From the Tandoor (Veg)', true, 'medium'],
  ['tand-malai-paneer', 'Malai Paneer Tikka', 260, 'From the Tandoor (Veg)', true, 'mild'],
  ['tand-afghani-paneer', 'Afghani Paneer Tikka', 260, 'From the Tandoor (Veg)', true, 'mild'],
  ['tand-paneer-angara', 'Paneer Angara', 250, 'From the Tandoor (Veg)', true, 'hot'],

  // --- FROM THE TANDOOR NON-VEG ---
  ['tand-chk-half', 'Tandoori Chicken (Half)', 220, 'From the Tandoor (Non-Veg)', false, 'medium'],
  ['tand-chk-full', 'Tandoori Chicken (Full)', 410, 'From the Tandoor (Non-Veg)', false, 'medium'],
  ['tand-chk-tikka', 'Chicken Tikka', 270, 'From the Tandoor (Non-Veg)', false, 'medium'],
  ['tand-malai-chk', 'Malai Chicken Tikka', 290, 'From the Tandoor (Non-Veg)', false, 'mild'],
  ['tand-afghani-chk', 'Afghani Chicken Tikka', 290, 'From the Tandoor (Non-Veg)', false, 'mild'],
  ['tand-chk-angara', 'Chicken Angara Tikka', 280, 'From the Tandoor (Non-Veg)', false, 'hot'],
  ['tand-chk-kalimirch', 'Chicken Kali-mirch Tikka', 290, 'From the Tandoor (Non-Veg)', false, 'medium'],

  // --- NOODLE JUNCTION ---
  ['node-veg-hakka', 'Veg Hakka Noodles', 110, 'Noodle Junction', true],
  ['node-veg-schez', 'Veg Schezwan Noodles', 120, 'Noodle Junction', true, 'hot'],
  ['node-pan-hakka', 'Paneer Hakka Noodles', 130, 'Noodle Junction', true],
  ['node-pan-schez', 'Paneer Schezwan Noodles', 140, 'Noodle Junction', true, 'hot'],
  ['node-chk-hakka', 'Chicken Hakka Noodles', 140, 'Noodle Junction', false],
  ['node-chk-schez', 'Chicken Schezwan Noodles', 150, 'Noodle Junction', false, 'hot'],
  ['node-egg-hakka', 'Egg Hakka Noodles', 130, 'Noodle Junction', false],
  ['node-egg-schez', 'Egg Schezwan Noodles', 140, 'Noodle Junction', false, 'hot'],
  ['node-egg-chk-hakka', 'Egg Chicken Hakka Noodles', 160, 'Noodle Junction', false],
  ['node-egg-chk-schez', 'Egg Chicken Schezwan Noodles', 170, 'Noodle Junction', false, 'hot'],

  // --- CHINESE GRAVIES ---
  ['gravy-veg-manch', 'Veg Manchurian Gravy', 220, 'Chinese Gravies', true, 'medium'],
  ['gravy-chilli-paneer', 'Chilli Paneer Gravy', 220, 'Chinese Gravies', true, 'medium'],
  ['gravy-schez-paneer', 'Schezwan Chilli Paneer Gravy', 230, 'Chinese Gravies', true, 'hot'],
  ['gravy-chilli-mush', 'Chilli Mushroom Gravy', 280, 'Chinese Gravies', true, 'medium'],
  ['gravy-combo-veg', 'Chinese Combo Veg', 190, 'Chinese Gravies', true, 'medium'],
  ['gravy-chk-manch', 'Chicken Manchurian Gravy', 200, 'Chinese Gravies', false, 'medium'],
  ['gravy-chilli-chk', 'Chilli Chicken Gravy', 220, 'Chinese Gravies', false, 'medium'],
  ['gravy-schez-chk', 'Schezwan Chilli Chicken Gravy', 210, 'Chinese Gravies', false, 'hot'],
  ['gravy-combo-nonveg', 'Chinese Combo Non Veg', 240, 'Chinese Gravies', false, 'medium'],

  // --- CLASSIC INDIAN GRAVIES VEG ---
  ['ind-dal-fry', 'Dal Fry', 90, 'Classic Indian Gravies (Veg)', true],
  ['ind-dal-tadka', 'Dal Tadka', 110, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-dal-makhani', 'Dal Makhani', 160, 'Classic Indian Gravies (Veg)', true, 'mild'],
  ['ind-mix-veg', 'Mix Veg', 210, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-mili-juli', 'Veg Mili Juli', 220, 'Classic Indian Gravies (Veg)', true],
  ['ind-paneer-handi', 'Paneer Handi', 260, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-veg-kolhapuri', 'Veg Kolhapuri', 230, 'Classic Indian Gravies (Veg)', true, 'hot'],
  ['ind-veg-jaipuri', 'Veg Jaipuri', 220, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-matar-paneer', 'Matar Paneer', 220, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-methi-matar', 'Methi Matar Malai', 200, 'Classic Indian Gravies (Veg)', true, 'mild'],
  ['ind-paneer-dopyaaza', 'Paneer Do-Pyaaza', 210, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-paneer-masala', 'Paneer Masala', 190, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-paneer-butter', 'Paneer Butter Masala', 220, 'Classic Indian Gravies (Veg)', true, 'mild'],
  ['ind-paneer-tikka', 'Paneer Tikka Masala', 280, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-paneer-bhurji', 'Amritsari Paneer Bhurji', 240, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-kadhai-paneer', 'Kadhai Paneer', 240, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-paneer-lababdar', 'Paneer Lababdar', 260, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-shahi-paneer', 'Shahi Paneer', 280, 'Classic Indian Gravies (Veg)', true, 'mild'],
  ['ind-malai-kofta', 'Malai Kofta', 240, 'Classic Indian Gravies (Veg)', true, 'mild'],
  ['ind-mush-masala', 'Mushroom Masala', 210, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-mush-dopyaaza', 'Mushroom Do-Pyaaza', 210, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-kadhai-mush', 'Kadhai Mushroom', 230, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-mush-matar', 'Mushroom Matar Masala', 230, 'Classic Indian Gravies (Veg)', true, 'medium'],
  ['ind-mush-kolhapuri', 'Mushroom Kolhapuri', 220, 'Classic Indian Gravies (Veg)', true, 'hot'],

  // --- CLASSIC INDIAN GRAVIES NON-VEG & MUTTON ---
  ['ind-egg-curry', 'Egg Curry', 160, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-egg-masala', 'Egg Masala', 170, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-fish-curry', 'Fish Curry', 140, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-fish-masala', 'Fish Masala', 140, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-curry', 'Chicken Curry', 220, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-masala', 'Chicken Masala', 230, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-butter', 'Chicken Butter Masala', 240, 'Classic Indian Gravies (Non-Veg)', false, 'mild'],
  ['ind-chk-dopyaaza', 'Chicken Do-Pyaaza', 240, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-kolhapuri', 'Chicken Kolhapuri', 240, 'Classic Indian Gravies (Non-Veg)', false, 'hot'],
  ['ind-kadhai-chk', 'Kadhai Chicken', 240, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-dehati-chk', 'Dehati Chicken', 220, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-korma', 'Chicken Korma', 240, 'Classic Indian Gravies (Non-Veg)', false, 'mild'],
  ['ind-chk-tikkamasala', 'Chicken Tikka Masala', 280, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-handi', 'Chicken Handi (6 pc)', 330, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-chk-changezi', 'Chicken Changezi', 290, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-rara-chk', 'Rara Chicken', 340, 'Classic Indian Gravies (Non-Veg)', false, 'hot'],
  ['ind-chk-chettinad', 'Chicken Chettinad', 280, 'Classic Indian Gravies (Non-Veg)', false, 'hot'],
  ['ind-mutton-curry', 'Mutton Curry', 340, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-mutton-rogan', 'Mutton Rogan Josh', 360, 'Classic Indian Gravies (Non-Veg)', false, 'medium'],
  ['ind-mutton-korma', 'Mutton Korma', 360, 'Classic Indian Gravies (Non-Veg)', false, 'mild'],

  // --- RICE & BIRYANI ---
  ['rice-steamed', 'Steamed Rice', 80, 'Rice & Biryani', true],
  ['rice-jeera', 'Jeera Rice', 90, 'Rice & Biryani', true],
  ['rice-veg-fried', 'Veg Fried Rice', 120, 'Rice & Biryani', true],
  ['rice-veg-schez', 'Veg Schezwan Fried Rice', 130, 'Rice & Biryani', true, 'hot'],
  ['rice-egg-fried', 'Egg Fried Rice', 140, 'Rice & Biryani', false],
  ['rice-pan-fried', 'Paneer Fried Rice', 150, 'Rice & Biryani', true],
  ['rice-chk-fried', 'Chicken Fried Rice', 160, 'Rice & Biryani', false],
  ['rice-egg-chk-fried', 'Egg Chicken Fried Rice', 180, 'Rice & Biryani', false],
  ['rice-lemon', 'Lemon Rice', 130, 'Rice & Biryani', true],
  ['bir-veg', 'Veg Biryani', 180, 'Rice & Biryani', true, 'medium'],
  ['bir-paneer', 'Paneer Biryani', 210, 'Rice & Biryani', true, 'medium'],
  ['bir-pan-hyd', 'Paneer Hyderabadi Biryani', 220, 'Rice & Biryani', true, 'medium'],
  ['bir-chk', 'Chicken Biryani', 210, 'Rice & Biryani', false, 'medium'],
  ['bir-chk-hyd', 'Chicken Hyderabadi Biryani', 220, 'Rice & Biryani', false, 'medium'],
  ['bir-mutt', 'Mutton Biryani', 270, 'Rice & Biryani', false, 'medium'],
  ['bir-mutt-hyd', 'Mutton Hyderabadi Biryani', 280, 'Rice & Biryani', false, 'medium'],

  // --- INDIAN BREADS ---
  ['bread-tawa', 'Tawa Roti', 10, 'Indian Breads', true],
  ['bread-tawa-butter', 'Tawa Butter Roti', 15, 'Indian Breads', true],
  ['bread-tand-roti', 'Tandoori Roti', 20, 'Indian Breads', true],
  ['bread-tand-butter', 'Tandoori Butter Roti', 25, 'Indian Breads', true],
  ['bread-naan', 'Naan', 40, 'Indian Breads', true],
  ['bread-naan-butter', 'Butter Naan', 45, 'Indian Breads', true],
  ['bread-naan-garlic', 'Garlic Naan', 50, 'Indian Breads', true],
  ['bread-naan-cheese', 'Cheese Naan', 65, 'Indian Breads', true],
  ['bread-kulcha', 'Kulcha', 40, 'Indian Breads', true],
  ['bread-kulcha-masala', 'Masala Kulcha', 50, 'Indian Breads', true],
  ['bread-kulcha-paneer', 'Paneer Kulcha', 60, 'Indian Breads', true],
  ['bread-laccha', 'Laccha Paratha', 35, 'Indian Breads', true],
  ['bread-aloo', 'Aloo Paratha', 50, 'Indian Breads', true],
  ['bread-paneer', 'Paneer Paratha', 60, 'Indian Breads', true],

  // --- DESSERTS & ACCOMPANIMENTS ---
  ['des-gulab', 'Gulab Jamun (2pc)', 40, 'Desserts & Accompaniments', true],
  ['des-rasgulla', 'Rasgulla (2 pc)', 40, 'Desserts & Accompaniments', true],
  ['des-vanilla', 'Vanilla Ice-cream', 70, 'Desserts & Accompaniments', true],
  ['des-butterscotch', 'Butter-Scotch Ice-cream', 80, 'Desserts & Accompaniments', true],
  ['des-chocolate', 'Chocolate Ice-cream', 80, 'Desserts & Accompaniments', true],
  ['des-strawberry', 'Strawberry ice-cream', 80, 'Desserts & Accompaniments', true],
  ['acc-green-salad', 'Green Salad', 70, 'Desserts & Accompaniments', true],
  ['acc-onion-salad', 'Onion Salad', 40, 'Desserts & Accompaniments', true],
  ['acc-bundi-raita', 'Bundi Raita', 50, 'Desserts & Accompaniments', true],
  ['acc-mix-raita', 'Mix Raita', 60, 'Desserts & Accompaniments', true],
  ['acc-cuc-raita', 'Cucumber Raita', 40, 'Desserts & Accompaniments', true],
  ['acc-roasted-papad', 'Roasted Papad (2pc)', 40, 'Desserts & Accompaniments', true],
  ['acc-fried-papad', 'Fried Papad (2pc)', 50, 'Desserts & Accompaniments', true],
  ['acc-masala-papad', 'Masala Papad', 60, 'Desserts & Accompaniments', true],

  // --- HERITAGE THALIS ---
  ['thali-royal-veg', 'Royal Heritage Veg Thali', 320, 'Heritage Thalis', true],
  ['thali-dehati-nonveg', 'Dehati Chicken Thali', 380, 'Heritage Thalis', false, 'medium'],
  ['thali-delight-jumbo', 'Curry Delight Jumbo Feast Thali', 450, 'Heritage Thalis', true, 'medium']
];

export const MENU_ITEMS: MenuItem[] = compactItems.map(([id, name, price, category, isVeg, spiceLevel]) => {
  return {
    id,
    name,
    description: generateDescription(name, category),
    price,
    category,
    isVeg,
    spiceLevel: spiceLevel || (category.includes('Biryani') || category.includes('Gravies') ? 'medium' : undefined),
    image: CATEGORY_IMAGES[category] || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    imagePrompt: `Gourmet food presentation of ${name}, elegant plating in high-end Indian restaurant context, cinematic warm lighting, close-up details, 4:3 aspect ratio`,
    badge: name.includes('Spl.') || name.includes('Combo') ? 'Chef\'s Pick' : undefined
  };
});

export const SPECIAL_OFFER = {
  title: "The Kahalgaon Family Feast Offer",
  discount: "Flat 15% OFF",
  description: "Get 15% OFF on your first online order of ₹600 or more! Use coupon code DELIGHT15 at checkout. Valid for both delivery & takeaway orders.",
  code: "DELIGHT15",
  minOrder: 600
};
