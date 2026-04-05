import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaSun, FaChartLine, FaHandshake, FaStar, FaWhatsapp, 
    FaShieldAlt, FaClock, FaThumbsUp,
    FaCalculator, FaInfoCircle, FaMoneyBillWave, FaBuilding,
    FaFileInvoice, FaTachometerAlt, FaSearch, FaHome,
    FaCheckCircle, FaPlug, FaUserPlus, FaRocket, FaMedal
} from 'react-icons/fa';

const HomePage = () => {
    return (
        <div className="bg-white">
            {/* Top Bar */}
            <div className="bg-yellow-500 text-gray-900 text-center py-2 text-sm font-medium">
                ⭐ أكثر من 5000 عميل مهتم بالطاقة الشمسية في تونس - احصل على دراستك التقريبية الآن مجاناً
            </div>

            {/* Hero Section مع صورة خلفية */}
            <section 
                className="relative bg-cover bg-center bg-no-repeat min-h-[85vh] flex items-center"
                style={{ 
                    backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.5)), url('/images/hero-bg.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%'
                }}
            >
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="relative z-10 max-w-6xl mx-auto text-center text-white px-4 py-16">
                    <div className="flex justify-center mb-6">
                        <div className="bg-yellow-500/20 backdrop-blur-sm p-4 rounded-full">
                            <FaSun className="text-5xl text-yellow-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                        اكتشف كم تحتاج <br />
                        <span className="text-yellow-400">من الطاقة الشمسية ووفر حتى 90% من فاتورة الكهرباء</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-4 max-w-2xl mx-auto opacity-90">
                        احصل على دراسة تقريبية مجانية لمعرفة القدرة المطلوبة لمنزلك
                    </p>
                    <p className="text-md mb-8 max-w-2xl mx-auto opacity-80">
                        ⚡ هذا الحساب هو تقدير أولي - الدراسة النهائية والسعر يتم تقديمهما بعد التواصل مع فريقنا
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/calculator"
                            className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105 shadow-lg"
                        >
                            ابدأ الحساب التقريبي الآن
                        </Link>
                        {/* المكان الأول: زر انضم كشركة في الهيرو */}
                        <Link
                            to="/join-as-company"
                            className="inline-block bg-transparent hover:bg-white/20 border-2 border-white text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105 shadow-lg flex items-center gap-2"
                        >
                            <FaBuilding /> انضم كشركة شريكة
                        </Link>
                    </div>
                    
                    {/* إحصاءات سريعة */}
                    <div className="flex flex-wrap justify-center gap-6 mt-12">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">+120</div>
                            <div className="text-sm opacity-80">مشروع منجز</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">+50</div>
                            <div className="text-sm opacity-80">شركة شريكة</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">+5000</div>
                            <div className="text-sm opacity-80">عميل راضٍ</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Independent Platform Message */}
            <div className="bg-blue-50 border-b border-blue-200 py-3">
                <div className="max-w-6xl mx-auto text-center px-4">
                    <p className="text-blue-800 font-medium">
                        🤝 نحن منصة مستقلة - نقارن لك عروض عدة شركات تركيب معتمدة لنضمن لك أفضل سعر وأفضل جودة
                    </p>
                </div>
            </div>

            {/* How It Works */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        كيف يعمل Shamsi.tn؟
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        ثلاث خطوات بسيطة للحصول على دراسة تقريبية للنظام الشمسي
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: FaChartLine, title: 'أدخل معلومات منزلك', desc: 'قم بإدخال بيانات فاتورة الكهرباء ومساحة السطح والولاية', color: 'bg-blue-100 text-blue-600' },
                            { icon: FaCalculator, title: 'احصل على تقدير تقريبي', desc: 'نحسب لك القدرة التقريبية وعدد الألواح والتوفير السنوي المتوقع', color: 'bg-yellow-100 text-yellow-600' },
                            { icon: FaHandshake, title: 'تواصل مع فريقنا', desc: 'فريقنا يتواصل معك لتقديم دراسة دقيقة وعرض نهائي', color: 'bg-green-100 text-green-600' }
                        ].map((step, i) => (
                            <div key={i} className="text-center p-6 rounded-xl hover:shadow-lg transition group">
                                <div className={`${step.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition`}>
                                    <step.icon className="text-3xl" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        لماذا تختار Shamsi.tn؟
                    </h2>
                    <p className="text-center text-gray-600 mb-12">
                        نقدم لك أفضل الخدمات لضمان راحتك وثقتك
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: FaShieldAlt, title: 'شركات معتمدة', desc: 'نعمل مع أفضل شركات الطاقة الشمسية المعتمدة في تونس', color: 'text-green-600' },
                            { icon: FaStar, title: 'دراسة تقريبية مجانية', desc: 'احصل على تقدير أولي دون أي التزام', color: 'text-yellow-600' },
                            { icon: FaThumbsUp, title: 'مقارنة العروض', desc: 'نقارن لك عروض عدة شركات للحصول على أفضل عرض', color: 'text-blue-600' },
                            { icon: FaClock, title: 'دعم فني', desc: 'فريق متخصص للإجابة على استفساراتك طوال الوقت', color: 'text-purple-600' }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition text-center">
                                <div className={`${item.color} text-4xl mb-3 flex justify-center`}>
                                    <item.icon />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Payment Methods Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        💰 طرق الدفع لشراء نظام الطاقة الشمسية
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        اختر طريقة الدفع المناسبة لك - نرشحك لأفضل خيار حسب حالتك
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaMoneyBillWave className="text-green-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-3">💰 دفع نقدي</h3>
                            <p className="text-gray-600 text-center">
                                الدفع نقداً هو الخيار الأسرع لتركيب النظام الشمسي. بعد الدراسة التقنية يتم تركيب النظام مباشرة خلال أيام.
                            </p>
                        </div>

                        <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200 hover:shadow-lg transition relative">
                            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaHandshake className="text-yellow-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-3">🏦 تمويل STEG / PROSOL</h3>
                            <p className="text-gray-600 text-center mb-3">
                                برنامج PROSOL هو برنامج تمويل من الدولة التونسية بالتعاون مع STEG والبنوك.
                                يمكنك دفع النظام الشمسي بالتقسيط عبر فاتورة الكهرباء لمدة تصل إلى 7 سنوات.
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                                <p className="text-red-700 text-sm text-center">
                                    ⚠️ بعض الشركات تضيف تكاليف إضافية، لذلك ننصح دائماً بمقارنة العروض قبل الاختيار.
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaBuilding className="text-blue-600 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold text-center mb-3">🏢 إيجار تمويلي</h3>
                            <p className="text-gray-600 text-center">
                                يمكن أيضاً تمويل المشروع عبر شركات التأجير التمويلي (Leasing)، خاصة للمحلات التجارية والمصانع والشركات.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action for Companies - المكان الثاني */}
            <section className="py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="max-w-5xl mx-auto text-center text-white">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                            <FaBuilding className="text-5xl" />
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        هل أنت شركة تركيب طاقة شمسية؟
                    </h2>
                    <p className="text-xl mb-6 opacity-95 max-w-2xl mx-auto">
                        انضم إلى منصة Shamsi.tn واحصل على طلبات عملاء جدد يومياً
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                            <p className="font-bold">+5000</p>
                            <p className="text-sm">عميل مهتم</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                            <p className="font-bold">+120</p>
                            <p className="text-sm">مشروع منجز</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                            <p className="font-bold">+50</p>
                            <p className="text-sm">شريك نجاح</p>
                        </div>
                    </div>
                    <div className="mt-8">
                        <Link
                            to="/join-as-company"
                            className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto w-fit"
                        >
                            <FaUserPlus /> سجل شركتك الآن - مجاناً
                        </Link>
                        <p className="text-sm mt-4 opacity-80">
                            * لا يوجد أي التزام، تواصل معنا وسنرسل لك جميع التفاصيل
                        </p>
                    </div>
                </div>
            </section>

            {/* Installation Process Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        ☀️ كيف يتم تركيب النظام الشمسي؟
                    </h2>
                    <p className="text-center text-gray-600 mb-12">
                        نوضح لك الخطوات من البداية حتى التركيب النهائي
                    </p>
                    <div className="grid md:grid-cols-5 gap-4">
                        {[
                            { icon: FaFileInvoice, step: '1', title: 'معرفة الاستهلاك', desc: 'نقوم أولاً بتحليل استهلاكك السنوي للكهرباء باستخدام رقم العداد' },
                            { icon: FaTachometerAlt, step: '2', title: 'حساب القدرة', desc: 'نحسب القدرة المناسبة لمنزلك وعدد الألواح المطلوبة' },
                            { icon: FaSearch, step: '3', title: 'دراسة الشركة المعتمدة', desc: 'نقوم بالتواصل مع شركات معتمدة لدى STEG لتقديم عرض تقني ومالي' },
                            { icon: FaHome, step: '4', title: 'زيارة تقنية', desc: 'يقوم مهندس بزيارة المنزل للتأكد من المساحة والاتجاه' },
                            { icon: FaCheckCircle, step: '5', title: 'التركيب', desc: 'بعد الموافقة يتم تركيب النظام خلال أيام قليلة' }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl shadow-md text-center relative">
                                <div className="absolute -top-3 -right-3 bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                    {item.step}
                                </div>
                                <div className="text-yellow-600 text-3xl mb-3 flex justify-center">
                                    <item.icon />
                                </div>
                                <h3 className="font-bold text-md mb-2">{item.title}</h3>
                                <p className="text-gray-600 text-xs">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Where to find meter number */}
            <section className="py-12 px-4 bg-blue-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        🔌 أين أجد رقم العداد الكهربائي (Compteur STEG)؟
                    </h2>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1">
                                <p className="text-gray-700 mb-4">
                                    رقم العداد موجود في <strong>أعلى يسار فاتورة الكهرباء</strong> الخاصة بك.
                                </p>
                                <p className="text-gray-700 mb-4">
                                    هذا الرقم يساعدنا على معرفة <strong>الاستهلاك الحقيقي خلال 12 شهر</strong> الماضية.
                                </p>
                                <a
                                    href="https://wa.me/21624661499?text=مرحباً، أريد مساعدة في معرفة رقم العداد الكهربائي"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition"
                                >
                                    <FaWhatsapp className="inline ml-2" /> تواصل معنا للمساعدة
                                </a>
                            </div>
                            <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-4 text-center">
                                    <FaPlug className="text-4xl text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">📄 مثال: أعلى فاتورة STEG ستجد رقم العداد</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        شركاؤنا
                    </h2>
                    <p className="text-gray-600 mb-12">
                        نعمل مع أفضل الجهات والشركات المعتمدة في تونس
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-12">
                        <div className="text-center">
                            <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="font-bold text-blue-600">STEG</span>
                            </div>
                            <p className="text-sm text-gray-500">الشركة التونسية للكهرباء والغاز</p>
                        </div>
                        <div className="text-center">
                            <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="font-bold text-green-600">ANME</span>
                            </div>
                            <p className="text-sm text-gray-500">الوكالة الوطنية للتحكم في الطاقة</p>
                        </div>
                        <div className="text-center">
                            <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <span className="font-bold text-yellow-600">شركات معتمدة</span>
                            </div>
                            <p className="text-sm text-gray-500">أكثر من 50 شركة تركيب معتمدة</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Real Projects Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        مشاريع حقيقية في تونس
                    </h2>
                    <p className="text-center text-gray-600 mb-12">
                        أمثلة لتركيبات الطاقة الشمسية التي قمنا بها مع عملائنا
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { city: 'صفاقس', kw: '5 kW', type: 'منزل', description: 'تركيب نظام 5 كيلوواط لمنزل في صفاقس' },
                            { city: 'سوسة', kw: '3 kW', type: 'محل تجاري', description: 'نظام شمسي لمحل تجاري في سوسة' },
                            { city: 'تونس', kw: '30 kW', type: 'مصنع', description: 'تركيب نظام 30 كيلوواط لمصنع في تونس' }
                        ].map((project, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition p-6 text-center">
                                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaSun className="text-yellow-600 text-2xl" />
                                </div>
                                <h3 className="font-bold text-xl mb-2">{project.city}</h3>
                                <div className="flex justify-between items-center mb-3 px-4">
                                    <span className="text-gray-600">قدرة النظام:</span>
                                    <span className="font-bold text-green-600">{project.kw}</span>
                                </div>
                                <p className="text-gray-500 text-sm">{project.description}</p>
                                <span className="inline-block mt-3 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                    {project.type}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 px-4 bg-yellow-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        ماذا يقول عملاؤنا؟
                    </h2>
                    <p className="text-center text-gray-600 mb-12">
                        آراء حقيقية من عملاء استفادوا من خدماتنا
                    </p>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { name: 'أحمد من صفاقس', text: 'الدراسة التقريبية كانت دقيقة جداً. الفريق تواصل معي وقدم لي دراسة نهائية ممتازة.', stars: 5, image: 'أ' },
                            { name: 'سارة من تونس', text: 'خدمة ممتازة. حصلت على تقدير دقيق لاحتياجي وساعدوني في اختيار أفضل شركة تركيب.', stars: 5, image: 'س' },
                            { name: 'محمد من سوسة', text: 'نظام شمسي ممتاز. التقدير الأولي كان قريباً جداً من الدراسة النهائية.', stars: 5, image: 'م' },
                            { name: 'فاطمة من المنستير', text: 'فريق محترف وسريع. الدراسة التقريبية ساعدتني في اتخاذ القرار.', stars: 5, image: 'ف' }
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                                <div className="flex text-yellow-500 mb-3">
                                    {[...Array(testimonial.stars)].map((_, j) => (
                                        <FaStar key={j} />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {testimonial.image}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{testimonial.name}</p>
                                        <p className="text-xs text-gray-500">عميل راضٍ</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Info Note Section */}
            <section className="py-8 px-4 bg-blue-50">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100">
                        <FaInfoCircle className="text-blue-500 text-3xl mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">📌 ملاحظة مهمة</h3>
                        <p className="text-blue-700">
                            هذا الحساب هو <strong>تقدير أولي تقريبي</strong> بناءً على بيانات فاتورتك. 
                            الدراسة النهائية والسعر النهائي يتم تقديمهما بعد التواصل مع فريقنا والزيارة الميدانية.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">جاهز لمعرفة احتياجك التقريبي من الطاقة الشمسية؟</h2>
                    <p className="text-xl mb-8">احصل على دراسة تقريبية مجانية خلال دقيقة</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/calculator"
                            className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-800 font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105"
                        >
                            ابدأ الحساب التقريبي الآن
                        </Link>
                        <a
                            href="https://wa.me/21624661499?text=مرحباً، أريد استشارة مجانية حول الطاقة الشمسية"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition flex items-center justify-center gap-2"
                        >
                            <FaWhatsapp /> تواصل عبر WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            {/* Floating Button for Companies - المكان الثالث (زر عائم) */}
            <Link
                to="/join-as-company"
                className="fixed bottom-6 left-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition transform hover:scale-110 z-50 flex items-center gap-2 group"
                title="انضم كشركة شريكة"
            >
                <FaBuilding className="text-xl" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                    انضم كشركة شريكة
                </span>
            </Link>
        </div>
    );
};

export default HomePage;