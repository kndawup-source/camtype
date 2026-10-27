CAMTYPE - Camera preference / recommendation prototype

Current structure
- Mobile-first static frontend
- Supabase not connected yet
- localStorage CMS for admin edits
- Admin PIN: 529816 (temporary client-side gate only)
- Images can be added later using image URL fields
- Numeric questions use a wheel picker

Recommendation flow
1. Budget (hard constraint)
2. Main shooting subject
3. Photo / video balance
4. Portability
5. Lens style
6. Control preference
7. Visual mood
8. Color preference
9. Output / editing preference
10. Final relationship with camera

Result
- CAMTYPE personality result
- BEST MATCH
- LIGHTER alternative
- BETTER VALUE alternative

Admin
- Questions: order, type, text, options, image URL, score JSON, wheel range
- Products: body, price, image, trait JSON, visibility
- Recommendation combos: lens, total price, tags
- Result types: name, line, scoring keys, visibility
- Statistics: starts, completions, completion rate, recommendations, type distribution, answer distribution

Supabase migration later
- Replace localStorage reads/writes with database queries
- Move images to Supabase Storage
- Move admin PIN to server-side authentication / RLS
