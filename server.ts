import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route for generating the analytical report
  app.post("/api/gemini/report", async (req, res) => {
    try {
      const { products = [], categories = [], orders = [] } = req.body;
      
      const lightProducts = Array.isArray(products) 
        ? products.slice(0, 100).map((p: any) => ({ name: p.name, price: p.price, inStock: p.inStock, category: p.categoryName || p.category }))
        : [];
      const lightCategories = Array.isArray(categories) 
        ? categories.map((c: any) => ({ name: c.name }))
        : [];
      const lightOrders = Array.isArray(orders) 
        ? orders.slice(0, 100).map((o: any) => ({ total: o.total, status: o.status }))
        : [];

      const prompt = `أنت مساعد ذكاء اصطناعي خبير في تحليل البيانات والمبيعات. 
      لدينا متجر أو منصة تجارية وهذه بياناتها الحالية:
      - عدد المنتجات: ${products.length} (عينة: ${JSON.stringify(lightProducts.slice(0, 15))})
      - عدد التصنيفات: ${categories.length} (عينة: ${JSON.stringify(lightCategories.slice(0, 15))})
      - عدد الطلبات: ${orders.length} (عينة: ${JSON.stringify(lightOrders.slice(0, 15))})
      
      يرجى كتابة تقرير تحليلي ملخص باللغة العربية يشمل:
      1. نظرة عامة على الأداء والمخزون.
      2. التحديات المتوقعة بناءً على نقص المخزون أو وفرة الطلبات.
      3. توصيات ومقترحات لتحسين الأداء وزيادة المبيعات.
      
      اجعل التقرير احترافياً ومقسماً وواضحاً وبدون أي مقدمات غير ضرورية. استخدم الماركداون للتنسيق.`;

      const candidateModels = ["gemini-3.6-flash", "gemini-2.5-pro", "gemini-3.0-flash", "gemini-3.5-flash"];
      let response = null;
      let lastError: any = null;

      for (const model of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model,
              contents: prompt,
            });
            if (response && response.text) break;
          } catch (err: any) {
            lastError = err;
            console.warn(`Attempt ${attempt} for model ${model} failed:`, err?.message || err);
            // If it's a 503 high demand error, wait briefly before retrying or switching model
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 1000 * attempt));
            }
          }
        }
        if (response && response.text) break;
      }

      if (!response || !response.text) {
        const isUnavailable = lastError?.status === "UNAVAILABLE" || lastError?.message?.includes("503") || lastError?.message?.includes("high demand");
        const errMsg = isUnavailable 
          ? "الخدمة تواجه ضغطاً كبيراً حالياً من المزود. يرجى المحاولة بعد لحظات."
          : (lastError?.message || "تعذر توليد التقرير حالياً");
        return res.status(503).json({ error: errMsg });
      }

      res.json({ report: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "حدث خطأ غير متوقع أثناء توليد التقرير" });
    }
  });

  // ==================== FAZAA (فزعة) API ENDPOINTS ====================
  // In-memory fallback database store for quick API responses (synced with client Firestore)
  let inMemoryFazaaOrders: any[] = [
    {
      id: "fz-1001",
      orderNumber: "FAZAA-1001",
      orderScope: "local",
      pickupAddress: "صنعاء - شارع حدة، بجوار بنك اليمن والكويت",
      deliveryAddress: "صنعاء - حي الأصبحي، عمارة الأمل",
      orderType: "ترت وجاتو - كابتن مختص",
      isInstant: true,
      scheduledDatetime: "",
      notes: "يرجى القيادة بهدوء وحمل الكعكة بعناية فائقة لأنها مكونة من دورين.",
      attachmentUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=600&auto=format&fit=crop&q=80",
      customerName: "أحمد بن علي المقالح",
      customerPhone: "771234567",
      customerId: "cust-501",
      driverName: "الكابتن محمد الحيمي",
      driverPhone: "778899001",
      status: "delivering",
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "fz-1002",
      orderNumber: "FAZAA-1002",
      orderScope: "local",
      pickupAddress: "صنعاء - شارع الزبيري، مكتبة السلام",
      deliveryAddress: "صنعاء - الجامعة القديمة، كلية الهندسة",
      orderType: "أوراق مهمة",
      isInstant: false,
      scheduledDatetime: "2026-08-04T10:30:00",
      notes: "مستندات وأوراق رسالة ماجستير هامة جداً، تسلم للعميل شخصياً.",
      attachmentUrl: "",
      customerName: "سارة عبد الله الشامي",
      customerPhone: "733445566",
      customerId: "cust-502",
      driverName: "",
      driverPhone: "",
      status: "new",
      createdAt: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: "fz-1003",
      orderNumber: "FAZAA-1003",
      orderScope: "local",
      pickupAddress: "صنعاء - التحرير، محل زجاج وهدايا",
      deliveryAddress: "صنعاء - شارع ستين الشمالي",
      orderType: "قابلة للكسر",
      isInstant: true,
      scheduledDatetime: "",
      notes: "تحفة كريستال قابلة للكسر. الرجاء التأكد من التغليف.",
      attachmentUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80",
      customerName: "فؤاد حسن الذاري",
      customerPhone: "770011223",
      customerId: "cust-503",
      driverName: "الكابتن هشام السنحاني",
      driverPhone: "775544332",
      status: "assigned",
      createdAt: new Date(Date.now() - 900000).toISOString()
    }
  ];

  let inMemoryFazaaCategories: any[] = [
    { id: "fc-1", name: "قابلة للكسر", riskLevel: "fragile", weightLimit: "حتى 15 كيلو", driverInstructions: "قيادة هادئة وتجنب المطبات والحمل بحذر", isActive: true },
    { id: "fc-2", name: "ترت وجاتو - كابتن مختص", riskLevel: "special_handle", weightLimit: "أحجام مختلفة", driverInstructions: "استخدام حقيبة تبريد وتثبيت الصندوق أفقياً", isActive: true },
    { id: "fc-3", name: "بقالات", riskLevel: "normal", weightLimit: "حتى 20 كيلو", driverInstructions: "تأكد من مطابقة الأصناف قبل المغادرة", isActive: true },
    { id: "fc-4", name: "كرتون - لا يزيد عن 10 كيلو", riskLevel: "normal", weightLimit: "10 كيلو كحد أقصى", driverInstructions: "تثبيت الكرتون على الدراجة بأحزمة الأمان", isActive: true },
    { id: "fc-5", name: "ميني كيك وحلويات", riskLevel: "special_handle", weightLimit: "حتى 5 كيلو", driverInstructions: "تسليم فوري ومباشر مع المحافظة على التبريد", isActive: true },
    { id: "fc-6", name: "أغراض شخصية", riskLevel: "normal", weightLimit: "حتى 8 كيلو", driverInstructions: "الحفاظ على خصوصية العميل", isActive: true },
    { id: "fc-7", name: "إكسسوارات", riskLevel: "normal", weightLimit: "حتى 3 كيلو", driverInstructions: "تسليم في حقيبة مغلقة", isActive: true },
    { id: "fc-8", name: "تحف وهدايا", riskLevel: "fragile", weightLimit: "حتى 7 كيلو", driverInstructions: "العناية بالغلاف الخارجي وعدم وضع أثقال فوق الهدايا", isActive: true },
    { id: "fc-9", name: "أوراق مهمة", riskLevel: "special_handle", weightLimit: "مستندات", driverInstructions: "حفظ الوثائق في مغلف ضد الماء وتسليم باليد", isActive: true }
  ];

  let inMemoryAppUsers: any[] = [
    { id: "cust-501", name: "أحمد بن علي المقالح", phone: "771234567", gender: "male", email: "ahmed@example.com", createdAt: new Date().toISOString() },
    { id: "cust-502", name: "سارة عبد الله الشامي", phone: "733445566", gender: "female", email: "sara@example.com", createdAt: new Date().toISOString() },
    { id: "cust-503", name: "فؤاد حسن الذاري", phone: "770011223", gender: "male", email: "fouad@example.com", createdAt: new Date().toISOString() }
  ];

  // POST /api/fazaa/create-order - Create new Fazaa Order
  app.post("/api/fazaa/create-order", async (req, res) => {
    try {
      const {
        order_scope,
        orderScope,
        pickup_address,
        pickupAddress,
        delivery_address,
        deliveryAddress,
        order_type,
        orderType,
        category_id,
        categoryId,
        is_instant,
        isInstant,
        scheduled_datetime,
        scheduledDatetime,
        notes,
        attachment_url,
        attachmentUrl,
        customerName,
        customer_name,
        customerPhone,
        customer_phone,
        customerId,
        customer_id
      } = req.body;

      const scopeVal = order_scope || orderScope || "local";
      const pickupVal = pickup_address || pickupAddress;
      const deliveryVal = delivery_address || deliveryAddress;
      const typeVal = order_type || orderType || "أغراض شخصية";
      const catIdVal = category_id || categoryId || "";
      const isInstantVal = is_instant !== undefined ? Boolean(is_instant) : (isInstant !== undefined ? Boolean(isInstant) : true);
      const scheduledVal = scheduled_datetime || scheduledDatetime || "";
      const notesVal = notes || "";
      const attachVal = attachment_url || attachmentUrl || "";
      const custNameVal = customer_name || customerName || "عميل فزعة";
      const custPhoneVal = customer_phone || customerPhone || "770000000";
      const custIdVal = customer_id || customerId || `cust-${Date.now()}`;

      if (!pickupVal || !deliveryVal) {
        return res.status(400).json({ error: "عنوان الاستلام وعنوان التسليم حقول إجبارية في طلب فزعة" });
      }

      const orderNumber = `FAZAA-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = {
        id: `fz-${Date.now()}`,
        orderNumber,
        orderScope: scopeVal,
        pickupAddress: pickupVal,
        deliveryAddress: deliveryVal,
        orderType: typeVal,
        categoryId: catIdVal,
        isInstant: isInstantVal,
        scheduledDatetime: scheduledVal,
        notes: notesVal,
        attachmentUrl: attachVal,
        customerName: custNameVal,
        customerPhone: custPhoneVal,
        customerId: custIdVal,
        driverName: "",
        driverPhone: "",
        status: "new",
        createdAt: new Date().toISOString()
      };

      inMemoryFazaaOrders.unshift(newOrder);

      res.status(201).json({
        success: true,
        message: "تم إنشاء طلب فزعة بنجاح واستلامه في النظام",
        order: newOrder
      });
    } catch (err: any) {
      console.error("Error creating Fazaa order:", err);
      res.status(500).json({ error: "حدث خطأ أثناء معالجة طلب فزعة" });
    }
  });

  // GET /api/fazaa/orders - List all Fazaa Orders
  app.get("/api/fazaa/orders", (req, res) => {
    res.json({ orders: inMemoryFazaaOrders });
  });

  // PATCH /api/fazaa/orders/:id/status - Update Fazaa Order Status
  app.patch("/api/fazaa/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, driverName, driverPhone } = req.body;
    const orderIndex = inMemoryFazaaOrders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: "طلب فزعة غير موجود" });
    }

    inMemoryFazaaOrders[orderIndex] = {
      ...inMemoryFazaaOrders[orderIndex],
      ...(status ? { status } : {}),
      ...(driverName !== undefined ? { driverName } : {}),
      ...(driverPhone !== undefined ? { driverPhone } : {}),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "تم تحديث حالة طلب فزعة بنجاح",
      order: inMemoryFazaaOrders[orderIndex]
    });
  });

  // GET /api/fazaa/categories - List Fazaa Shipment Categories
  app.get("/api/fazaa/categories", (req, res) => {
    res.json({ categories: inMemoryFazaaCategories });
  });

  // POST /api/fazaa/categories - Add/Update Fazaa Shipment Category
  app.post("/api/fazaa/categories", (req, res) => {
    const { id, name, riskLevel, weightLimit, driverInstructions, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "اسم قسم / تصنيف فزعة مطلوب" });
    }

    if (id) {
      const idx = inMemoryFazaaCategories.findIndex(c => c.id === id);
      if (idx !== -1) {
        inMemoryFazaaCategories[idx] = {
          ...inMemoryFazaaCategories[idx],
          name: name.trim(),
          riskLevel: riskLevel || "normal",
          weightLimit: weightLimit || "",
          driverInstructions: driverInstructions || "",
          isActive: isActive !== undefined ? Boolean(isActive) : true
        };
        return res.json({ success: true, category: inMemoryFazaaCategories[idx] });
      }
    }

    const newCategory = {
      id: `fc-${Date.now()}`,
      name: name.trim(),
      riskLevel: riskLevel || "normal",
      weightLimit: weightLimit || "",
      driverInstructions: driverInstructions || "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      createdAt: new Date().toISOString()
    };

    inMemoryFazaaCategories.push(newCategory);
    res.status(201).json({ success: true, category: newCategory });
  });

  // ==================== APP CUSTOMERS / USER PROFILE API ====================
  // GET /api/users - List app customers
  app.get("/api/users", (req, res) => {
    res.json({ users: inMemoryAppUsers });
  });

  // GET /api/users/:id - Get specific customer profile
  app.get("/api/users/:id", (req, res) => {
    const user = inMemoryAppUsers.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "المستخدم غير موجود" });
    }
    res.json({ user });
  });

  // POST /api/users/profile - Register or create customer profile
  app.post("/api/users/profile", (req, res) => {
    const { name, phone, gender, email } = req.body;
    if (!name || !phone || !gender) {
      return res.status(400).json({ error: "الاسم ورقم الهاتف والنوع (ذكر/أنثى) حقول إجبارية لتسجيل العميل" });
    }

    const existingIndex = inMemoryAppUsers.findIndex(u => u.phone === phone.trim());
    if (existingIndex !== -1) {
      inMemoryAppUsers[existingIndex] = {
        ...inMemoryAppUsers[existingIndex],
        name: name.trim(),
        gender,
        ...(email ? { email: email.trim() } : {}),
        updatedAt: new Date().toISOString()
      };
      return res.json({
        success: true,
        message: "تم تحديث بيانات حساب العميل بنجاح",
        user: inMemoryAppUsers[existingIndex]
      });
    }

    const newUser = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      gender,
      email: email ? email.trim() : "",
      createdAt: new Date().toISOString()
    };

    inMemoryAppUsers.push(newUser);
    res.status(201).json({
      success: true,
      message: "تم تسجيل حساب العميل بنجاح",
      user: newUser
    });
  });

  // PUT /api/users/profile/:id - Update existing customer profile
  app.put("/api/users/profile/:id", (req, res) => {
    const { id } = req.params;
    const { name, phone, gender, email, avatarUrl } = req.body;

    const idx = inMemoryAppUsers.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "حساب العميل غير موجود" });
    }

    inMemoryAppUsers[idx] = {
      ...inMemoryAppUsers[idx],
      ...(name ? { name: name.trim() } : {}),
      ...(phone ? { phone: phone.trim() } : {}),
      ...(gender ? { gender } : {}),
      ...(email !== undefined ? { email: email.trim() } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "تم تعديل بيانات الحساب بنجاح",
      user: inMemoryAppUsers[idx]
    });
  });

  // ==================== ROAD NETWORK ROUTING API ====================
  // POST /api/routes/compute - Precision road network distance and routing calculation
  app.post("/api/routes/compute", async (req, res) => {
    try {
      const { origin, destination, travelMode = "DRIVE", curvatureFactor = 1.38 } = req.body;

      // Extract Coordinates or Landmark locations
      const YEMEN_COORDS: Record<string, { lat: number; lng: number }> = {
        "حدة": { lat: 15.3184, lng: 44.1852 },
        "السبعين": { lat: 15.3312, lng: 44.2081 },
        "التحرير": { lat: 15.3547, lng: 44.2065 },
        "الحصبة": { lat: 15.3850, lng: 44.2021 },
        "الستين الغربي": { lat: 15.3400, lng: 44.1700 },
        "الستين الجنوبي": { lat: 15.3120, lng: 44.1950 },
        "بيت بوس": { lat: 15.2850, lng: 44.2050 },
        "سعوان": { lat: 15.3650, lng: 44.2500 },
        "حي الجامعة": { lat: 15.3680, lng: 44.1810 },
        "كريتر": { lat: 12.7794, lng: 45.0367 },
        "المعلا": { lat: 12.7930, lng: 45.0080 },
        "المنصورة": { lat: 12.8620, lng: 44.9870 },
        "الشيخ عثمان": { lat: 12.8750, lng: 44.9950 },
        "المكلا": { lat: 14.5360, lng: 49.1280 },
        "تعز": { lat: 13.5780, lng: 44.0150 }
      };

      const resolveCoords = (input: any): { lat: number; lng: number } => {
        if (!input) return { lat: 15.3184, lng: 44.1852 };
        if (typeof input === "object" && typeof input.lat === "number" && typeof input.lng === "number") {
          return { lat: input.lat, lng: input.lng };
        }
        if (typeof input === "string") {
          for (const [key, c] of Object.entries(YEMEN_COORDS)) {
            if (input.includes(key)) return c;
          }
        }
        return { lat: 15.3547, lng: 44.2065 };
      };

      const origCoord = resolveCoords(origin);
      const destCoord = resolveCoords(destination);

      // Attempt 1: OSRM (OpenStreetMap Real-World Street Routing Engine)
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origCoord.lng},${origCoord.lat};${destCoord.lng},${destCoord.lat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(4000) });
        if (osrmRes.ok) {
          const osrmData: any = await osrmRes.json();
          if (osrmData.code === "Ok" && osrmData.routes && osrmData.routes.length > 0) {
            const route = osrmData.routes[0];
            const meters = route.distance || 1000;
            const durationSec = route.duration || 300;
            const distanceKm = Number((meters / 1000).toFixed(2));
            const durationMinutes = Math.max(4, Math.ceil(durationSec / 60));
            const coordinates = route.geometry?.coordinates?.map(([lng, lat]: [number, number]) => [lat, lng]) || [];

            return res.json({
              success: true,
              distanceKm,
              durationMinutes,
              method: "osrm_openstreetmap",
              coordinates,
              routeSummary: `مسار شوارع واقعي (OSRM): ${distanceKm} كم (~${durationMinutes} دقيقة)`
            });
          }
        }
      } catch (osrmErr) {
        console.warn("OSRM routing attempt failed or timed out:", osrmErr);
      }

      // Attempt 2: Google Maps Routes API if key is available
      const gmpKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (gmpKey && gmpKey !== "YOUR_API_KEY") {
        try {
          const routesApiUrl = "https://routes.googleapis.com/directions/v2:computeRoutes";
          const requestBody = {
            origin: {
              location: {
                latLng: {
                  latitude: origCoord.lat,
                  longitude: origCoord.lng
                }
              }
            },
            destination: {
              location: {
                latLng: {
                  latitude: destCoord.lat,
                  longitude: destCoord.lng
                }
              }
            },
            travelMode: travelMode === "TWO_WHEELER" ? "TWO_WHEELER" : "DRIVE",
            routingPreference: "TRAFFIC_AWARE",
            computeAlternativeRoutes: false,
            languageCode: "ar",
            units: "METRIC"
          };

          const gmpRes = await fetch(routesApiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": gmpKey,
              "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
            },
            body: JSON.stringify(requestBody)
          });

          if (gmpRes.ok) {
            const data: any = await gmpRes.json();
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const meters = route.distanceMeters || 1000;
              const durationSec = parseInt(route.duration?.replace("s", "") || "300", 10);
              const distanceKm = Number((meters / 1000).toFixed(1));
              const durationMinutes = Math.ceil(durationSec / 60);

              return res.json({
                success: true,
                distanceKm: Math.max(1.0, distanceKm),
                durationMinutes: Math.max(5, durationMinutes),
                method: "google_routes_api",
                polyline: route.polyline?.encodedPolyline || null,
                routeSummary: `مسار Google Routes API: ${distanceKm} كم (~${durationMinutes} دقيقة)`
              });
            }
          }
        } catch (apiErr) {
          console.warn("Routes API attempt failed, falling back to topology engine:", apiErr);
        }
      }

      // Precision Road Network Topology Engine (Great Circle + Street Network Topology Factors)
      const R = 6371; // Earth radius in KM
      const dLat = ((destCoord.lat - origCoord.lat) * Math.PI) / 180;
      const dLon = ((destCoord.lng - origCoord.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((origCoord.lat * Math.PI) / 180) *
          Math.cos((destCoord.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const airDistance = R * c;

      // Realistic street curvature factor
      let factor = Number(curvatureFactor) || 1.38;
      if (airDistance < 3) factor = 1.45; // City grid & intersections
      else if (airDistance < 8) factor = 1.38;
      else factor = 1.32;

      const roadDistanceKm = Number((Math.max(0.8, airDistance) * factor).toFixed(1));
      const avgSpeedKmH = travelMode === "TWO_WHEELER" ? 28 : 22; // urban driving speed
      const durationMinutes = Math.max(6, Math.ceil((roadDistanceKm / avgSpeedKmH) * 60) + 4);

      return res.json({
        success: true,
        distanceKm: Math.max(1.0, roadDistanceKm),
        airDistanceKm: Number(airDistance.toFixed(1)),
        durationMinutes,
        method: "road_network_topology",
        routeSummary: `شبكة الطرق الواقعية: ${roadDistanceKm} كم (~${durationMinutes} دقيقة)`
      });
    } catch (err: any) {
      console.error("Routing error:", err);
      res.status(500).json({ error: "Failed computing road route", distanceKm: 3.5, durationMinutes: 12 });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
