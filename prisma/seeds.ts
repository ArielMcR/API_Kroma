import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seeds...');

    const company = await prisma.company.create({
        data: {
            tradeName: 'Barbearia Exemplo',
            legalName: 'Barbearia Exemplo LTDA',
            cnpj: '12.345.678/0001-99',
            plan: 'premium',
        },
    });

    const unit = await prisma.unit.create({
        data: {
            companyId: company.id,
            name: "Unidade Central",
            address: "Rua Principal, 123",
            phone: "(11) 99999-9999",
        },
    });

    const passwordHash = bcrypt.hashSync('123', 10);
    const superAdmin = await prisma.user.create({
        data: {
            name: 'João da Silva',
            email: 'admin@barbearia.com',
            passwordHash: passwordHash,
            role: Role.SUPER_ADMIN,
            companyId: company.id,
            unitId: unit.id,
        },
    });
    await prisma.user.create({
        data: {
            name: 'Rodrigues',
            email: 'maria@barbearia.com',
            passwordHash: passwordHash,
            role: Role.BARBER,
            companyId: company.id,
            unitId: unit.id,
        }
    });
    await prisma.user.create({
        data: {
            name: 'Machado',
            email: 'machado@barbearia.com',
            passwordHash: passwordHash,
            role: Role.SUPERVISOR,
            companyId: company.id,
            unitId: unit.id,
        }
    });
    await prisma.user.create({
        data: {
            name: 'Ariel',
            email: 'ariel@barbearia.com',
            passwordHash: passwordHash,
            role: Role.ADMIN,
            companyId: company.id,
            unitId: unit.id,
        }
    });

    const corte = await prisma.service.create({
        data: {
            companyId: company.id,
            unitId: unit.id,
            name: 'Corte Masculino',
            price: 40,
            durationMinutes: 30,
        },
    });

    const barba = await prisma.service.create({
        data: {
            companyId: company.id,
            name: 'Barba Completa',
            unitId: unit.id,
            price: 30,
            durationMinutes: 20,
        },
    });

    const client1 = await prisma.client.create({
        data: {
            companyId: company.id,
            unitId: unit.id,
            name: 'Carlos',
            lastName: 'Almeida',
            cellPhone: '11988887777',
        },
    });

    const client2 = await prisma.client.create({
        data: {
            companyId: company.id,
            unitId: unit.id,
            name: 'Pedro',
            lastName: 'Henrique',
            cellPhone: '11955554444',
        },
    });

    const client3 = await prisma.client.create({
        data: {
            companyId: company.id,
            unitId: unit.id,
            name: 'Lucas',
            lastName: 'Souza',
            cellPhone: '11922223333',
        },
    });

    const product1 = await prisma.product.create({
        data: {
            unitId: unit.id,
            name: "Pomada Modeladora",
            unitPrice: 15,
            profitPercentage: 100,
            salePrice: 30,
            stock: 20,
        },
    });

    const product2 = await prisma.product.create({
        data: {
            unitId: unit.id,
            name: "Shampoo Premium",
            unitPrice: 25,
            profitPercentage: 80,
            salePrice: 45,
            stock: 15,
        },
    });

    // AGENDA DE TRABALHO DO ADMIN/BARBEIRO
    // await prisma.workSchedule.createMany({
    //     data: [
    //         {
    //             usuarioId: superAdmin.id,
    //             unidadeId: unit.id,
    //             diaSemana: 1, // segunda
    //             inicio: "09:00",
    //             fim: "18:00"
    //         },
    //         {
    //             usuarioId: superAdmin.id,
    //             unidadeId: unit.id,
    //             diaSemana: 3, // quarta
    //             inicio: "09:00",
    //             fim: "18:00"
    //         },
    //     ]
    // });

    await prisma.appointment.create({
        data: {
            unitId: unit.id,
            companyId: company.id,
            clientId: client1.id,
            serviceId: corte.id,
            professionalId: superAdmin.id,
            appointmentDate: new Date(),
            startTime: "10:00",
            endTime: "10:30",
            status: "confirmado",
        },
    });

    await prisma.appointment.create({
        data: {
            unitId: unit.id,
            companyId: company.id,
            clientId: client2.id,
            serviceId: barba.id,
            professionalId: superAdmin.id,
            appointmentDate: new Date(),
            startTime: "11:00",
            endTime: "11:20",
            status: "pendente",
        },
    });

    // VENDA + ITENS
    const sale = await prisma.sale.create({
        data: {
            unitId: unit.id,
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
