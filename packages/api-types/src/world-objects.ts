import { z } from 'zod';

export const sWorldObject = z.object({
  id: z.string().describe('The unique identifier of the world object'),
  label: z.string().describe('The label of the world object'),
});
// { label: "Backpacks", value: "backpack" },
//   { label: "Cell Phones", value: "cell phone" },
//   { label: "Hand Bags", value: "handbag" },
//   { label: "Laptops", value: "laptop" },
//   { label: "People", value: "person" },
export type WorldObject = z.infer<typeof sWorldObject>;

export const worldObjects: WorldObject[] = [
  {
    id: 'person',
    label: 'Person',
  },
  {
    id: 'backpack',
    label: 'Backpack',
  },
  {
    id: 'cell-phone',
    label: 'Cell Phone',
  },
  {
    id: 'handbag',
    label: 'Handbag',
  },
  {
    id: 'laptop',
    label: 'Laptop',
  },
  {
    id: 'bicycle',
    label: 'Bicycle',
  },
  {
    id: 'car',
    label: 'Car',
  },
];
