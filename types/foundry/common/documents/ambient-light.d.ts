import type { Document, DocumentMetadata } from "../abstract/module.js";
import type { LightData } from "../data/data.js";
import type * as fields from "../data/fields.js";
import type BaseScene from "./scene.js";

/** The AmbientLight embedded document model. */
export default class BaseAmbientLight<
	TParent extends BaseScene | null,
> extends Document<TParent, AmbientLightSchema> {
	static override get metadata(): AmbientLightMetadata;

	static override defineSchema(): AmbientLightSchema;

	protected override _initialize(): void;
}

export default interface BaseAmbientLight<TParent extends BaseScene | null>
    extends Document<TParent, AmbientLightSchema>,
        ModelPropsFromSchema<AmbientLightSchema> {}

interface AmbientLightMetadata extends DocumentMetadata {
	name: "AmbientLight";
	collection: "lights";
	label: "DOCUMENT.AmbientLight";
	isEmbedded: true;
}

type AmbientLightSchema = {
	/** The _id which uniquely identifies this BaseAmbientLight embedded document */
	_id: fields.DocumentIdField;
	/** The x-coordinate position of the origin of the light */
	x: fields.NumberField<number, number, true, false, true>;
	/** The y-coordinate position of the origin of the light */
	y: fields.NumberField<number, number, true, false, true>;
	/** The angle of rotation for the tile between 0 and 360 */
	rotation: fields.AngleField;
	/** Whether or not this light source is constrained by Walls */
	walls: fields.BooleanField;
	/** Whether or not this light source provides a source of vision */
	vision: fields.BooleanField;
	/** Light configuration data */
	config: fields.EmbeddedDataField<LightData>;
	/** Is the light source currently hidden? */
	hidden: fields.BooleanField;
	/** An object of optional key/value flags */
	flags: fields.ObjectField<DocumentFlags>;
};
