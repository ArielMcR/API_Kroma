import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seeds...');

    await prisma.settings.create({
        data: {
            tradeName: 'Barbearia Exemplo',
            legalName: 'Barbearia Exemplo LTDA',
            cnpj: '12.345.678/0001-99',
            address: 'Rua Principal, 123',
            phone: '(11) 99999-9999',
        },
    });

    const passwordHash = bcrypt.hashSync('123', 10);
    const admin = await prisma.user.create({
        data: {
            name: 'João da Silva',
            email: 'admin@barbearia.com',
            passwordHash: passwordHash,
            role: Role.ADMIN,
        },
    });
    await prisma.user.create({
        data: {
            name: 'Rodrigues',
            email: 'maria@barbearia.com',
            passwordHash: passwordHash,
            role: Role.BARBER,
        }
    });
    await prisma.user.create({
        data: {
            name: 'Machado',
            email: 'machado@barbearia.com',
            passwordHash: passwordHash,
            role: Role.SUPERVISOR,
        }
    });
    await prisma.user.create({
        data: {
            name: 'Ariel',
            email: 'ariel@barbearia.com',
            passwordHash: passwordHash,
            role: Role.ADMIN,
        }
    });

    const corte = await prisma.service.create({
        data: {
            name: 'Corte Masculino',
            price: 40,
            durationMinutes: 30,
        },
    });

    const barba = await prisma.service.create({
        data: {
            name: 'Barba Completa',
            price: 30,
            durationMinutes: 20,
        },
    });

    const client1 = await prisma.client.create({
        data: {
            name: 'Carlos',
            lastName: 'Almeida',
            cellPhone: '11988887777',
        },
    });

    const client2 = await prisma.client.create({
        data: {
            name: 'Pedro',
            lastName: 'Henrique',
            cellPhone: '11955554444',
        },
    });

    await prisma.client.create({
        data: {
            name: 'Lucas',
            lastName: 'Souza',
            cellPhone: '11922223333',
        },
    });

    const product1 = await prisma.product.create({
        data: {
            name: "Pomada Modeladora",
            unitPrice: 15,
            profitPercentage: 100,
            salePrice: 30,
            stock: 20,
        },
    });

    const product2 = await prisma.product.create({
        data: {
            name: "Shampoo Premium",
            unitPrice: 25,
            profitPercentage: 80,
            salePrice: 45,
            stock: 15,
        },
    });

    await prisma.appointment.create({
        data: {
            clientId: client1.id,
            professionalId: admin.id,
            appointmentDate: new Date(),
            startTime: "10:00",
            endTime: "10:30",
            status: "confirmado",
            durationMinutes: corte.durationMinutes,
            services: {
                create: [{
                    serviceId: corte.id,
                    unitPrice: corte.price,
                    durationMinutes: corte.durationMinutes,
                    position: 0,
                }],
            },
        },
    });

    // Atendimento com DOIS servicos: a duracao e a soma (corte + barba).
    await prisma.appointment.create({
        data: {
            clientId: client2.id,
            professionalId: admin.id,
            appointmentDate: new Date(),
            startTime: "11:00",
            endTime: "11:50",
            status: "pendente",
            durationMinutes: corte.durationMinutes + barba.durationMinutes,
            services: {
                create: [
                    {
                        serviceId: corte.id,
                        unitPrice: corte.price,
                        durationMinutes: corte.durationMinutes,
                        position: 0,
                    },
                    {
                        serviceId: barba.id,
                        unitPrice: barba.price,
                        durationMinutes: barba.durationMinutes,
                        position: 1,
                    },
                ],
            },
        },
    });

    // VENDA + ITENS
    await prisma.sale.create({
        data: {
            clientId: client1.id,
            totalAmount: 75,
            paymentMethod: "pix",
            items: {
                create: [
                    {
                        productId: product1.id,
                        quantity: 1,
                        unitPrice: product1.salePrice,
                        totalAmount: product1.salePrice,
                    },
                    {
                        productId: product2.id,
                        quantity: 1,
                        unitPrice: product2.salePrice,
                        totalAmount: product2.salePrice,
                    },
                ],
            },
        },
    });

    console.log('🌱 Seeds finalizadas com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
