import React from 'react';
import { Link } from 'react-router-dom';
import { FaSun, FaChartLine, FaHandshake, FaStar, FaArrowLeft, FaBuilding, FaTractor, FaIndustry, FaHome, FaWhatsapp, FaShieldAlt, FaClock, FaThumbsUp } from 'react-icons/fa';

const HomePage = () => {
    return (
        <div className="bg-white">
            {/* Hero Section مع صورة خلفية */}
            <section 
                className="relative bg-cover bg-center bg-no-repeat min-h-[85vh] flex items-center"
                style={{ 
                    backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.4)), url('/images/hero-bg.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%'
                }}
            >
                {/* طبقة شفافة إضافية لتحسين وضوح النص */}
                <div className="absolute inset-0 bg-black/30"></div>
                
                <div className="relative z-10 max-w-6xl mx-auto text-center text-white px-4 py-16">
                    <div className="flex justify-center mb-6">
                        <div className="bg-yellow-500/20 backdrop-blur-sm p-4 rounded-full">
                            <FaSun className="text-5xl text-yellow-400" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                        وفّر حتى <span className="text-yellow-400">80%</span> من فاتورة الكهرباء
                        <br />
                        باستخدام الطاقة الشمسية في تونس
                    </h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        احصل على دراسة مجانية لمنزلك أو شركتك واحسب كم يمكنك توفيره مع الطاقة الشمسية
                    </p>
                    <Link
                        to="/calculator"
                        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105 shadow-lg"
                    >
                        احسب تكلفة الطاقة الشمسية لمنزلك
                    </Link>
                    
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

            {/* How It Works */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        كيف يعمل Shamsi.tn؟
                    </h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        ثلاث خطوات بسيطة للحصول على الطاقة الشمسية في منزلك
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: FaChartLine, title: 'أدخل معلومات منزلك', desc: 'قم بإدخال بيانات فاتورة الكهرباء ومساحة السطح والولاية', color: 'bg-blue-100 text-blue-600' },
                            { icon: FaSun, title: 'احصل على دراسة مجانية', desc: 'نحسب لك القدرة المطلوبة وعدد الألواح والتوفير السنوي', color: 'bg-yellow-100 text-yellow-600' },
                            { icon: FaHandshake, title: 'تواصل مع أفضل الشركات', desc: 'شركات طاقة شمسية معتمدة تتواصل معك لتقديم عرض', color: 'bg-green-100 text-green-600' }
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
                            { icon: FaShieldAlt, title: 'شركات معتمدة', desc: 'نعمل مع أفضل شركات الطاقة الشمسية في تونس', color: 'text-green-600' },
                            { icon: FaStar, title: 'دراسة مجانية', desc: 'لا تدفع أي شيء للحصول على الدراسة', color: 'text-yellow-600' },
                            { icon: FaThumbsUp, title: 'أفضل سعر', desc: 'نضمن لك أفضل الأسعار من عدة شركات', color: 'text-blue-600' },
                            { icon: FaClock, title: 'دعم فني', desc: 'فريق متخصص للإجابة على استفساراتك', color: 'text-purple-600' }
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

            {/* Real Projects */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        مشاريع حقيقية في تونس
                    </h2>
                    <p className="text-center text-gray-600 mb-12">
                        شاهد أمثلة لتركيبات الطاقة الشمسية التي قمنا بها
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { city: 'صفاقس', kw: '5 kW', savings: '2,400 دينار/سنة', type: 'منزل', icon: FaHome },
                            { city: 'سوسة', kw: '3 kW', savings: '1,500 دينار/سنة', type: 'محل تجاري', icon: FaBuilding },
                            { city: 'تونس', kw: '6 kW', savings: '3,000 دينار/سنة', type: 'مصنع', icon: FaIndustry }
                        ].map((project, i) => {
                            const Icon = project.icon;
                            return (
                                <div key={i} className="bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition group">
                                    <div className="h-48 bg-gradient-to-r from-yellow-500 to-green-500 flex items-center justify-center relative overflow-hidden">
                                        <Icon className="text-7xl text-white opacity-50 group-hover:scale-110 transition duration-500" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition"></div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-lg">{project.city}</h3>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{project.type}</span>
                                        </div>
                                        <p className="text-gray-600">قدرة: {project.kw}</p>
                                        <p className="text-green-600 font-semibold">توفير: {project.savings}</p>
                                    </div>
                                </div>
                            );
                        })}
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
                            { name: 'أحمد من صفاقس', text: 'ركبت النظام الشمسي ووفرت 50% من فاتورة الكهرباء. خدمة ممتازة وسعر مناسب.', stars: 5, image: 'A' },
                            { name: 'سارة من تونس', text: 'الدراسة كانت دقيقة جداً والشركة المتعاقدة محترفة. أنصح بالتعامل مع Shamsi.tn.', stars: 5, image: 'S' },
                            { name: 'محمد من سوسة', text: 'منذ تركيب الألواح الشمسية وفاتورة الكهرباء انخفضت بشكل كبير. شكراً Shamsi.tn', stars: 5, image: 'M' },
                            { name: 'فاطمة من المنستير', text: 'فريق محترف وسريع في الرد. الدراسة كانت مجانية ودقيقة 100%', stars: 5, image: 'F' }
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

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">جاهز لتوفير فاتورة الكهرباء؟</h2>
                    <p className="text-xl mb-8">احصل على دراسة مجانية خلال دقيقة</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/calculator"
                            className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-800 font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105"
                        >
                            ابدأ الآن
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
        </div>
    );
};

export default HomePage;